var api = 'http://localhost:3000/api/measurements';
var token = localStorage.getItem('token') || '';


function loadMeasurements() {
  var range = document.getElementById('rangeSelect').value;
  axios.get(api + '?range=' + range, { headers:{ Authorization:'Bearer ' + token } })
  .then(function(res) {
    var data = res.data.measurements;

//Table
    var tb = document.getElementById('measurementsBody');
    tb.innerHTML = '';
    for (var i=0;i<data.length;i++){
      var d = new Date(data[i].timestamp);
      tb.innerHTML += '<tr>' +
        '<td>'+d.toLocaleDateString()+'</td>' +
        '<td>'+d.toLocaleTimeString()+'</td>' +
        '<td>'+data[i].value+'</td>' +
        '<td><button onclick="deleteMeasurement(\''+data[i]._id+'\')">Borrar</button></td>' +
      '</tr>';
    }

//Chart
    var labels = data.map(function(m){ return new Date(m.timestamp).toLocaleDateString(); });
    var vals   = data.map(function(m){ return m.value; });
    if(window.myChart) window.myChart.destroy();
    window.myChart = new Chart(document.getElementById('glucoseChart').getContext('2d'),{
      type:'line', data:{ labels:labels, datasets:[{ label:'Glucosa', data:vals }] }
    });
  }).catch(function(e){ console.log(e); alert('Error cargando'); });
}

//Measurement Emergent
document.getElementById('newMeasurementBtn').onclick = function(){
  document.getElementById('measurementEm').style.display = 'block';
  document.getElementById('inputValue').value='';
  document.getElementById('inputTimestamp').value = new Date().toISOString().slice(0,16);
};
document.getElementById('cancelMeasurementBtn').onclick = function(){
  document.getElementById('measurementEm').style.display = 'none';
};
window.onclick = function(e){ 
  if(e.target == document.getElementById('measurementEm')) 
    document.getElementById('measurementEm').style.display='none'; 
};

//Save Measurement
document.getElementById('saveMeasurementBtn').onclick = function(){
  var v = document.getElementById('inputValue').value;
  var ts= document.getElementById('inputTimestamp').value;
  axios.post(api, 
    { user:localStorage.getItem('userId'), type:'glucosa', value:parseFloat(v), timestamp: new Date(ts) },
    { headers:{ Authorization:'Bearer ' + token } }
  )
  .then(function(){
    loadMeasurements(); 
    document.getElementById('measurementEm').style.display='none'; 
    alert('Guardado'); 
  })
  .catch(function(e){ console.log(e); alert('Error guardar'); });
};

//Delete Measurement
function deleteMeasurement(id){
  if(confirm('¿Seguro?')){
    axios.delete(api + '/' + id, { headers:{ Authorization:'Bearer ' + token } })
    .then(function(){ loadMeasurements(); alert('Borrado'); });
  }
}

document.getElementById('rangeSelect').onchange = loadMeasurements;

loadMeasurements();
