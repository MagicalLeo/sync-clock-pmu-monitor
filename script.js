document.addEventListener('DOMContentLoaded', function () {
    let csvChartInstance;
    let excelChartInstance1;
    let excelChartInstance2;

    let csvBaseline = 0;
    let originalCsvValues = []; // 存储原始的CSV值

    window.electronAPI.getGlobalData((event, globalData) => {
        const initialLabels = generateInitialLabels();
        const initialValues = generateInitialValues();

        const csvData = globalData.csvData || [];
        const excelData = globalData.excelData || [];

        const csvThreshold = globalData.csvThreshold || '';
        const excelThreshold1 = globalData.excelThreshold1 || '';
        const excelThreshold2 = globalData.excelThreshold2 || '';

        initializeCharts(initialLabels, initialValues);

        // 将读入的阈值显示在相应的输入框中
        document.getElementById('csvThresholdInput').value = csvThreshold;
        document.getElementById('excelThresholdInput1').value = excelThreshold1;
        document.getElementById('excelThresholdInput2').value = excelThreshold2;

        // 更新状态灯
        updateStatusLight('csvChart', 'csvThresholdInput', 'csvStatusLight');
        updateStatusLight('excelChart1', 'excelThresholdInput1', 'excelStatusLight1');
        updateStatusLight('excelChart2', 'excelThresholdInput2', 'excelStatusLight2');

        // 如果全局数据中有CSV数据，绘制CSV图表
        if (csvData.length > 0) {
            drawCsvChart(csvData);
        }

        // 如果全局数据中有Excel数据，绘制Excel图表
        if (excelData.length > 0) {
            drawExcelCharts(excelData);
        }
    });

    document.getElementById('resetCsvZoom').addEventListener('click', function () {
        if (csvChartInstance) {
            csvChartInstance.resetZoom();
        }
    });

    document.getElementById('resetExcelZoom1').addEventListener('click', function () {
        if (excelChartInstance1) {
            excelChartInstance1.resetZoom();
        }
    });

    document.getElementById('resetExcelZoom2').addEventListener('click', function () {
        if (excelChartInstance2) {
            excelChartInstance2.resetZoom();
        }
    });

    function generateInitialLabels() {
        const labels = [];
        for (let i = 0; i < 24; i++) {
            labels.push(i.toString().padStart(2, '0') + ':00');
        }
        return labels;
    }

    function generateInitialValues() {
        const initialValues = [];
        for (let i = 0; i < 24; i++) {
            initialValues.push(0);
        }
        return initialValues;
    }

    function initializeCharts(initialLabels, initialValues) {
        csvChartInstance = createChart('csvChart', 'B码', initialLabels, initialValues, 'B码时间偏差(ns)');
        excelChartInstance1 = createChart('excelChart1', '电压一相角', initialLabels, initialValues, '相角值(°)');
        excelChartInstance2 = createChart('excelChart2', '电压二相角', initialLabels, initialValues, '相角值(°)');
    }

    document.getElementById('csvFileInput').addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            Papa.parse(file, {
                complete: function (results) {
                    const data = results.data;
                    console.log('CSV Data:', data);
                    window.electronAPI.setGlobalData('csvData', data);
                    drawCsvChart(data);
                    document.getElementById('csvOverlay').style.display = 'block';
                }
            });
        }
    });

    document.getElementById('csvBaselineConfirm').addEventListener('click', function () {
        const baselineValue = parseFloat(document.getElementById('csvBaselineInput').value);
        if (!isNaN(baselineValue)) {
            csvBaseline = baselineValue;
            updateCsvChartWithBaseline();
        }
    });

    document.getElementById('csvThresholdConfirm').addEventListener('click', function () {
        const threshold = parseFloat(document.getElementById('csvThresholdInput').value);
        if (!isNaN(threshold)) {
            window.electronAPI.setGlobalData('csvThreshold', threshold);
            updateStatusLight('csvChart', 'csvThresholdInput', 'csvStatusLight');
        }
    });

    document.getElementById('excelFileInput').addEventListener('change', function (event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const firstSheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                console.log('Excel Data:', jsonData);
                window.electronAPI.setGlobalData('excelData', jsonData);
                drawExcelCharts(jsonData);
                document.getElementById('excelOverlay1').style.display = 'block';
                document.getElementById('excelOverlay2').style.display = 'block';
            };
            reader.readAsArrayBuffer(file);
        }
    });

    document.getElementById('excelThresholdConfirm1').addEventListener('click', function () {
        const threshold = parseFloat(document.getElementById('excelThresholdInput1').value);
        if (!isNaN(threshold)) {
            window.electronAPI.setGlobalData('excelThreshold1', threshold);
            updateStatusLight('excelChart1', 'excelThresholdInput1', 'excelStatusLight1');
        }
    });

    document.getElementById('excelThresholdConfirm2').addEventListener('click', function () {
        const threshold = parseFloat(document.getElementById('excelThresholdInput2').value);
        if (!isNaN(threshold)) {
            window.electronAPI.setGlobalData('excelThreshold2', threshold);
            updateStatusLight('excelChart2', 'excelThresholdInput2', 'excelStatusLight2');
        }
    });

    function drawCsvChart(data) {
        const labels = data.slice(1).map(row => row[0]); // 将第一列作为横坐标
        originalCsvValues = data.slice(1).map(row => parseFloat(row[1])); // 存储原始的纵坐标

        const adjustedValues = originalCsvValues.map(value => value - csvBaseline);

        console.log('CSV Labels:', labels);
        console.log('CSV Values:', adjustedValues);

        if (csvChartInstance) {
            csvChartInstance.destroy();
        }

        csvChartInstance = createChart('csvChart', 'B码', labels, adjustedValues, 'B码时间偏差(ns)');
        updateStatusLight('csvChart', 'csvThresholdInput', 'csvStatusLight');
    }

    function updateCsvChartWithBaseline() {
        if (csvChartInstance) {
            const adjustedValues = originalCsvValues.map(value => value - csvBaseline);
            csvChartInstance.data.datasets[0].data = adjustedValues;
            csvChartInstance.update();
            updateStatusLight('csvChart', 'csvThresholdInput', 'csvStatusLight');
        }
    }

    function drawExcelCharts(data) {
        const filteredData = data.filter(row => row[0] && row[1] && row[2]);

        const labels = filteredData.slice(1).map(row => {
            const excelTime = row[0];
            // const date = new Date((excelTime - 25569) * 86400 * 1000); // Excel时间转JavaScript时间
            // const hours = date.getUTCHours();
            // const minutes = date.getUTCMinutes();
            // const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            return excelTime;
        });

        const values1 = filteredData.slice(1).map(row => parseFloat(row[1])); // 将第二列作为纵坐标
        const values2 = filteredData.slice(1).map(row => parseFloat(row[2])); // 将第三列作为纵坐标

        if (labels.length !== values1.length || labels.length !== values2.length) {
            console.error('数据长度不一致，检查数据源是否正确');
            return;
        }

        console.log('Excel Labels:', labels);
        console.log('Excel Values 1:', values1);
        console.log('Excel Values 2:', values2);

        if (excelChartInstance1) {
            excelChartInstance1.destroy();
        }
        if (excelChartInstance2) {
            excelChartInstance2.destroy();
        }

        excelChartInstance1 = createChart('excelChart1', '电压一相角', labels, values1, '相角值(°)');
        excelChartInstance2 = createChart('excelChart2', '电压二相角', labels, values2, '相角值(°)');

        // 更新状态灯
        updateStatusLight('excelChart1', 'excelThresholdInput1', 'excelStatusLight1');
        updateStatusLight('excelChart2', 'excelThresholdInput2', 'excelStatusLight2');
    }

    function createChart(canvasId, chartTitle, labels, data, yAxisLabel = '') {
        const ctx = document.getElementById(canvasId).getContext('2d');

        if (csvChartInstance && canvasId === 'csvChart') {
            csvChartInstance.destroy();
        } else if (excelChartInstance1 && canvasId === 'excelChart1') {
            excelChartInstance1.destroy();
        } else if (excelChartInstance2 && canvasId === 'excelChart2') {
            excelChartInstance2.destroy();
        }

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: chartTitle,
                    data: data,
                    borderColor: '#00FF00', // 绿色
                    borderWidth: 2,
                    fill: false
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: chartTitle,
                        color: '#FFFFFF' // 白色
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y;
                                }
                                return label;
                            }
                        }
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'xy'
                        },
                        zoom: {
                            wheel: {
                                enabled: true
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'xy'
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: false,
                        ticks: {
                            color: '#FFFFFF' // 白色
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.2)', // 白色
                            borderDash: [8, 4] // 虚线
                        }
                    },
                    y: {
                        beginAtZero: false,
                        ticks: {
                            color: '#FFFFFF' // 白色
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.2)', // 白色
                            borderDash: [8, 4] // 虚线
                        },
                        title: {
                            display: !!yAxisLabel,
                            text: yAxisLabel,
                            color: '#FFFFFF' // 白色
                        }
                    }
                }
            }
        });
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
    updateStatusLight('csvChart', 'csvThresholdInput', 'csvStatusLight');
    updateStatusLight('excelChart1', 'excelThresholdInput1', 'excelStatusLight1');
    updateStatusLight('excelChart2', 'excelThresholdInput2', 'excelStatusLight2');
});
