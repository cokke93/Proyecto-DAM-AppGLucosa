// routes/report.js
const express     = require('express');
const mongoose    = require('mongoose');
const Measurement = require('../models/Measurement');
const PDFDocument = require('pdfkit');
const router      = express.Router();

router.get('/', async (req, res) => {
  const { user, type, start, end } = req.query;
  if (!user || !type || !start || !end) {
    return res.status(400).json({ ok: false, error: 'Faltan parámetros: user, type, start, end' });
  }

  let userId;
  try {
    userId = new mongoose.Types.ObjectId(user);
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'ID de usuario no válido' });
  }

  try {
    const startDate = new Date(start);
    const endDate   = new Date(end);
    endDate.setHours(23,59,59,999);

    const list = await Measurement
      .find({ user: userId, type, timestamp: { $gte: startDate, $lte: endDate } })
      .sort({ timestamp: 1 });

    // Cabeceras HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reporte_${start.slice(0,10)}_${end.slice(0,10)}.pdf"`
    );

    const doc = new PDFDocument({ margin:40, size:'A4' });
    doc.pipe(res);

    // Colores
    const primaryColor   = '#1e3c72';
    const headerBg       = '#e8f0fe';
    const alternateBg    = '#f9f9f9';
    const textColor      = '#333';

    // --- TÍTULO ---
    doc
      .fillColor(primaryColor)
      .fontSize(22)
      .text('Reporte de Glucosa', { align:'center' })
      .moveDown(0.5);

    doc
      .fillColor(textColor)
      .fontSize(12)
      .text(`Periodo: ${start.slice(0,10)} — ${end.slice(0,10)}`, { align:'center' })
      .moveDown(1);

    // --- CABECERA DE TABLA ---
    const tableTop = doc.y;
    const colX     = [50, 200, 320];
    const colWidths= [120, 100, 100];

    // fondo de cabecera
    doc
      .rect(doc.page.margins.left, tableTop, doc.page.width - doc.page.margins.left*2, 20)
      .fill(headerBg);

    // texto de cabecera
    doc
      .fillColor(primaryColor)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Fecha',  colX[0], tableTop + 6)
      .text('Valor',  colX[1], tableTop + 6)
      .text('Estado', colX[2], tableTop + 6);

    doc.moveDown();

    // --- FILAS ---
    let y = tableTop + 20;
    list.forEach((m, i) => {
      // alternar fondo
      if (i % 2 === 0) {
        doc
          .rect(doc.page.margins.left, y, doc.page.width - doc.page.margins.left*2, 20)
          .fill(alternateBg);
      }
      // valores
      const fecha = new Date(m.timestamp).toLocaleDateString();
      let estado  = 'Normal';
      if (m.value < 70)  estado = 'Hipo';
      if (m.value > 180) estado = 'Híper';

      doc
        .fillColor(textColor)
        .font('Helvetica')
        .fontSize(10)
        .text(fecha,        colX[0], y + 6)
        .text(`${m.value} mg/dL`, colX[1], y + 6)
        .text(estado,       colX[2], y + 6);

      y += 20;
      doc.y = y;
    });

    doc.end();

  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }
});

module.exports = router;
