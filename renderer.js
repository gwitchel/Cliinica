document.getElementById('app').innerHTML = `
    <button id="loadData">Load Excel Data</button>
    <pre id="dataDisplay"></pre>
`;

document.getElementById('loadData').addEventListener('click', async () => {
    const result = await window.electronAPI.runPython('load_excel.py');
    document.getElementById('dataDisplay').textContent = result;
});
