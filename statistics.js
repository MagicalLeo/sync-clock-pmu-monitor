console.log('statistics.js is loaded');

document.addEventListener('DOMContentLoaded', function () {
  console.log('DOM content loaded');
  
  window.electronAPI.getGlobalData((event, globalData) => {
    console.log('Global Data:', globalData); // 確認這行是否被調用
    document.getElementById('csvThreshold').textContent = globalData.csvThreshold || '未设置';
    // document.getElementById('excelThreshold1').textContent = globalData.excelThreshold1 || '未设置';
    // document.getElementById('excelThreshold2').textContent = globalData.excelThreshold2 || '未设置';
    document.getElementById('excelThreshold3').textContent = globalData.excelThreshold3 || '未设置';

    processAndRenderData(globalData);
  });
  
  function updateTime() {
    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleTimeString();
    document.getElementById('current-time').textContent = `当前时间: ${formattedTime}`;
  }

  setInterval(updateTime, 1000);
  updateTime();
});

function processAndRenderData(globalData) {
  // const { csvData, excelData, csvThreshold, excelThreshold1, excelThreshold2, excelThreshold3 } = globalData;
  const { csvData, excelData, csvThreshold, excelThreshold3 } = globalData;
  // 處理和渲染 CSV 數據
  if (csvData && csvThreshold !== null) {
    const csvTableBody = document.getElementById('csvTableBody');
    csvTableBody.innerHTML = ''; // 清空表格内容

    csvData.slice(1).forEach(row => {
      const time = row[0];
      const value = parseFloat(row[1]);
      if (value > csvThreshold) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${time}</td><td>${value}</td>`;
        csvTableBody.appendChild(tr);
      }
    });
  }

  // 處理 Excel 數據的时间格式
  const filteredExcelData = excelData ? excelData.filter(row => row[0] && row[1] && row[2]) : [];

  const labels = filteredExcelData.slice(1).map(row => {
    const excelTime = row[0];
    return excelTime;
  });

  // 渲染 Excel 一相角數據
  // if (excelData && excelThreshold1 !== null) {
  //   const excelTableBody1 = document.getElementById('excelTableBody1');
  //   excelTableBody1.innerHTML = ''; // 清空表格内容

  //   filteredExcelData.slice(1).forEach((row, index) => {
  //     const time = labels[index];
  //     const value = parseFloat(row[1]);
  //     if (value > excelThreshold1) {
  //       const tr = document.createElement('tr');
  //       tr.innerHTML = `<td>${time}</td><td>${value}</td>`;
  //       excelTableBody1.appendChild(tr);
  //     }
  //   });
  // }

  // 渲染 Excel 二相角數據
  // if (excelData && excelThreshold2 !== null) {
  //   const excelTableBody2 = document.getElementById('excelTableBody2');
  //   excelTableBody2.innerHTML = ''; // 清空表格内容

  //   filteredExcelData.slice(1).forEach((row, index) => {
  //     const time = labels[index];
  //     const value = parseFloat(row[2]);
  //     if (value > excelThreshold2) {
  //       const tr = document.createElement('tr');
  //       tr.innerHTML = `<td>${time}</td><td>${value}</td>`;
  //       excelTableBody2.appendChild(tr);
  //     }
  //   });
  // }

  // 渲染 Excel 相角差數據
  if (excelData && excelThreshold3 !== null) {
    const excelTableBody3 = document.getElementById('excelTableBody3');
    excelTableBody3.innerHTML = ''; // 清空表格内容

    filteredExcelData.slice(1).forEach((row, index) => {
      const time = labels[index];
      const value = parseFloat(row[3]);
      if (value > excelThreshold3) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${time}</td><td>${value}</td>`;
        excelTableBody3.appendChild(tr);
      }
    });
  }
}

function toggleVisibility(elementId, button) {
  const element = document.getElementById(elementId);
  
  if (element.style.display === 'none') {
    element.style.display = '';
    button.textContent = '缩小';
  } else {
    element.style.display = 'none';
    button.textContent = '打开';
  }
}
