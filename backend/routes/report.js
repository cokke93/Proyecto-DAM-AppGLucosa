const express = require('express');
const mongoose = require('mongoose');
const Measurement = require('../models/Measurement');
const PDFDocument = require('pdfkit');
const router = express.Router();

//Get report
//    GET /api/report?user=ID&type=glucosa&start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/', async (req, res) => {
    const { user, type, start, end } = req.query;
    if (!user || !type || !start || !end) {
        return res
            .status(400)
            .json({ ok: false, error: 'Faltan parámetros: user, type, start, end' });
    }

    let userId;
    try {
        userId = new mongoose.Types.ObjectId(user);
    } catch (e) {
        return res
            .status(400)
            .json({ ok: false, error: 'ID de usuario no válido' });
    }

    try {
        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);

        const list = await Measurement.find({
            user: userId,
            type,
            timestamp: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ timestamp: 1 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="reporte_${start.slice(0, 10)}_${end.slice(0, 10)}.pdf"`
        );

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Reporte de Glucosa', { align: 'center' }).moveDown(0.5);
        doc.fontSize(12)
            .text(`Periodo: ${start.slice(0, 10)} — ${end.slice(0, 10)}`, { align: 'center' })
            .moveDown(1);

        // Table
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Fecha', 70, doc.y, { continued: true })
            .text('Valor', 200, doc.y, { continued: true })
            .text('Estado', 320, doc.y)
            .moveDown(0.5);

        doc.strokeColor('#aaa')
            .moveTo(70, doc.y).lineTo(550, doc.y)
            .stroke()
            .moveDown(0.5);

        doc.font('Helvetica');
        list.forEach(m => {
            const d = new Date(m.timestamp).toLocaleDateString();
            let estado = 'Normal';
            if (m.value < 70) estado = 'Hipo';
            if (m.value > 180) estado = 'Híper';

            doc.text(d, 70, doc.y, { continued: true })
                .text(`${m.value} mg/dL`, 200, doc.y, { continued: true })
                .text(estado, 320, doc.y)
                .moveDown(0.5);
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
