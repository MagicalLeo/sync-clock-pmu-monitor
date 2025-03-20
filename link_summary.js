let csvChartInstance;
let excelChartInstance1;
let excelChartInstance2;
let excelChartInstance3;

let linkCsvData, voltageXlsxData;

document.addEventListener('DOMContentLoaded', function () {
    
    window.electronAPI.getGlobalData((event, globalData) => {
        linkCsvData = globalData.csvData;
        voltageXlsxData = globalData.excelData;
        
        const excelThreshold3 = globalData.excelThreshold3 || '';
        
        if (linkCsvData) {
            console.log('CSV Data Loaded:', linkCsvData);
            drawFirstChart();
        }

        if (voltageXlsxData) {
            console.log('Excel Data Loaded:', voltageXlsxData);
            drawSecondAndThirdCharts();
        }
        
        // 获取阈值3的数据并刷新指示灯
        document.getElementById('excelThresholdInput3').value = excelThreshold3;
        updateStatusLight('chart3', 'excelThresholdInput3', 'excelStatusLight3');
    });
    
    initializeCharts();
    
    document.getElementById('linkCsvFileInput').addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                complete: function (results) {
                    linkCsvData = results.data;
                    console.log('CSV Data:', linkCsvData);
                    window.electronAPI.setGlobalData('csvData', linkCsvData);
                    drawFirstChart();
                }
            });
        }
    });

    document.getElementById('voltageXlsxFileInput').addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const firstSheet = workbook.Sheets[firstSheetName];
                voltageXlsxData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                console.log('Excel Data:', voltageXlsxData);
                window.electronAPI.setGlobalData('excelData', voltageXlsxData);
                drawSecondAndThirdCharts();
            };
            reader.readAsArrayBuffer(file);
        }
    });

    document.getElementById('excelThresholdConfirm3').addEventListener('click', function () {

        const threshold = parseFloat(document.getElementById('excelThresholdInput3').value);
        if (!isNaN(threshold)) {
            window.electronAPI.setGlobalData('excelThreshold3', threshold);
            updateStatusLight('chart3', 'excelThresholdInput3', 'excelStatusLight3');
        }
    });

    // 监听页面显示事件，确保在切换页面并返回时重新获取全局数据并更新状态灯
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            window.electronAPI.getGlobalData((event, globalData) => {
                const excelThreshold3 = globalData.excelThreshold3 || '';
                document.getElementById('excelThresholdInput3').value = excelThreshold3;
                updateStatusLight('chart3', 'excelThresholdInput3', 'excelStatusLight3');
            });
        }
    });
});

function initializeCharts() {
    const labels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');
    const placeholderData = Array(24).fill(0);

    drawChart('chart1', 'B码数据', labels, [
        { label: 'B码数据', data: placeholderData }
    ], 'B码时间偏差(ns)');

    drawChart('chart2', '电压相角', labels, [
        { label: '电压一相角', data: placeholderData },
        { label: '电压二相角', data: placeholderData }
    ], '相角值(°)');

    drawChart('chart3', '相角差', labels, [
        { label: '相角差', data: placeholderData }
    ], '相角值(°)');
}

function drawFirstChart() {
    const labels = linkCsvData.slice(1).map(row => row[0]);
    const linkData = linkCsvData.slice(1).map(row => parseFloat(row[1]));

    console.log('Drawing First Chart with Labels:', labels);
    console.log('Drawing First Chart with Data:', linkData);

    drawChart('chart1', 'B码数据', labels, [
        { label: 'B码数据', data: linkData }
    ], 'B码时间偏差(ns)');

    document.getElementById('resetZoom1').style.display = 'block';
}

function drawSecondAndThirdCharts() {
    
    const labels = voltageXlsxData.slice(1).map(row => {
        if (row.length === 0) return null;
        const excelTime = row[0];
        return excelTime;
    }).filter(label => label !== null);
   
    const voltagePhase1 = voltageXlsxData.slice(1).map(row => row.length === 0 ? null : parseFloat(row[1])).filter(value => value !== null);
    const voltagePhase2 = voltageXlsxData.slice(1).map(row => row.length === 0 ? null : parseFloat(row[2])).filter(value => value !== null);
    const phaseDifference = voltageXlsxData.slice(1).map(row => row.length === 0 ? null : parseFloat(row[3])).filter(value => value !== null);

    console.log('Drawing Second Chart with Labels:', labels);
    console.log('Drawing Second Chart with Data (Phase 1):', voltagePhase1);
    console.log('Drawing Second Chart with Data (Phase 2):', voltagePhase2);
    console.log('Drawing Third Chart with Data (Phase Difference):', phaseDifference);
    
    drawChart('chart2', '电压相角', labels, [
        { label: '电压一相角', data: voltagePhase1 },
        { label: '电压二相角', data: voltagePhase2 }
    ], '相角值(°)');

    drawChart('chart3', '相角差', labels, [
        { label: '相角差', data: phaseDifference },
    ], '相角值(°)');

    document.getElementById('resetZoom2').style.display = 'block';
    document.getElementById('resetZoom3').style.display = 'block';
}

function drawChart(canvasId, chartTitle, labels, datasets, yAxisLabel) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    if (canvasId === 'chart1' && csvChartInstance) {
        csvChartInstance.destroy();
    } else if (canvasId === 'chart2' && excelChartInstance2) {
        excelChartInstance2.destroy();
    } else if (canvasId === 'chart3' && excelChartInstance3) {
        excelChartInstance3.destroy();
    }

    const colors = ['#00FF00', '#FF0000', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

    const chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets.map((dataset, index) => ({
                label: dataset.label,
                data: dataset.data,
                borderColor: colors[index % colors.length],
                borderWidth: 2,
                fill: false
            }))
        },
        options: {
            responsive: true,
            plugins: {
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy',
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true,
                        },
                        mode: 'xy',
                    }
                },
                title: {
                    display: true,
                    text: chartTitle,
                    color: '#FFFFFF'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: false,
                    ticks: {
                        color: '#FFFFFF'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)',
                        borderDash: [8, 4]
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: '#FFFFFF'
                    },
                    title: {
                        display: true,
                        text: yAxisLabel,
                        color: '#FFFFFF'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)',
                        borderDash: [8, 4]
                    }
                }
            }
        }
    });

    document.getElementById(`resetZoom${canvasId[canvasId.length - 1]}`).addEventListener('click', function () {
        chartInstance.resetZoom();
    });

    if (canvasId === 'chart1') {
        csvChartInstance = chartInstance;
    } else if (canvasId === 'chart2') {
        excelChartInstance2 = chartInstance;
    } else if (canvasId === 'chart3') {
        excelChartInstance3 = chartInstance;
    }
}

function updateStatusLight(chartId, thresholdInputId, statusLightId) {
    const chart = Chart.getChart(chartId);
    const threshold = parseFloat(document.getElementById(thresholdInputId).value);
    const statusLight = document.getElementById(statusLightId);

    if (!isNaN(threshold) && chart) {
        const exceedsThreshold = chart.data.datasets[0].data.some(value => value > threshold);
        if (exceedsThreshold) {
            statusLight.style.backgroundColor = 'red';
            statusLight.style.boxShadow = '0 0 10px red';
        } else {
            statusLight.style.backgroundColor = '#00ff10';
            statusLight.style.boxShadow = '0 0 10px green';
        }
    } else {
        statusLight.style.backgroundColor = 'gray';
        statusLight.style.boxShadow = 'none';
    }
}

function updateTime() {
    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleTimeString();
    document.getElementById('current-time').textContent = `当前时间: ${formattedTime}`;
}

setInterval(updateTime, 1000);
updateTime();

// 页面加载时更新状态灯
updateStatusLight('chart3', 'excelThresholdInput3', 'excelStatusLight3');
