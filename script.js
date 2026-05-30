document.addEventListener('DOMContentLoaded', () => {

    // FIX: funciones globales limpias, sin pinMap viejo
    function hideAllPanels() {
        document.querySelectorAll('.info-panel').forEach(p => p.style.display = 'none');
    }

    window.mostrarInfo = function(id) {
        hideAllPanels();
        const panel = document.getElementById(id);
        if (panel) panel.style.display = 'block';
    };

    window.cerrarInfo = function() {
        hideAllPanels();
    };

    // Cerrar al clicar fuera de un panel
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.info-panel') && !e.target.closest('.pins')) {
            hideAllPanels();
        }
    });

    // --- Map: tooltip + zoom + pan ---
    const mapViewport = document.getElementById('mapViewport');
    const containerMap = document.querySelector('.contenedor-mapa');
    const tooltip = document.getElementById('mapTooltip');

    if (mapViewport && containerMap) {
        let scale = 1, translateX = 0, translateY = 0;

        function applyTransform() {
            mapViewport.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        }

        // Pan
        let dragging = false, startX = 0, startY = 0, baseX = 0, baseY = 0;
        mapViewport.addEventListener('pointerdown', (ev) => {
            if (ev.target.closest('.pins')) return;
            dragging = true;
            mapViewport.classList.add('dragging');
            startX = ev.clientX; startY = ev.clientY;
            baseX = translateX;  baseY = translateY;
            mapViewport.setPointerCapture(ev.pointerId);
        });
        mapViewport.addEventListener('pointermove', (ev) => {
            if (!dragging) return;
            translateX = baseX + (ev.clientX - startX);
            translateY = baseY + (ev.clientY - startY);
            applyTransform();
        });
        mapViewport.addEventListener('pointerup', (ev) => {
            dragging = false;
            mapViewport.classList.remove('dragging');
            try { mapViewport.releasePointerCapture(ev.pointerId); } catch(e) {}
        });
        mapViewport.addEventListener('pointercancel', () => {
            dragging = false;
            mapViewport.classList.remove('dragging');
        });

        // Tooltip positioning
        function positionTooltip(pin) {
            const pr = pin.getBoundingClientRect();
            const cr = containerMap.getBoundingClientRect();
            tooltip.style.left = `${pr.left - cr.left + pr.width / 2}px`;
            tooltip.style.top  = `${pr.top  - cr.top}px`;
        }

        // Zoom to pin
        function zoomToPin(pin, targetScale = 2) {
            const pr = pin.getBoundingClientRect();
            const cr = containerMap.getBoundingClientRect();
            const pinCX = pr.left - cr.left + pr.width  / 2;
            const pinCY = pr.top  - cr.top  + pr.height / 2;
            translateX = cr.width  / 2 - pinCX * targetScale;
            translateY = cr.height / 2 - pinCY * targetScale;
            scale = targetScale;
            applyTransform();
        }

        // Pin events
        document.querySelectorAll('.pins').forEach(pin => {
            const title  = pin.dataset.title || '';
            const infoId = pin.dataset.info  || '';

            pin.addEventListener('mouseenter', () => {
                if (!title) return;
                tooltip.textContent = title;
                tooltip.style.display = 'block';
                positionTooltip(pin);
            });
            pin.addEventListener('mousemove', () => positionTooltip(pin));
            pin.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

            pin.addEventListener('click', (ev) => {
                ev.stopPropagation();
                if (infoId) mostrarInfo(infoId);
                zoomToPin(pin, 2);
            });
        });

        // Click outside → reset zoom + cerrar panels
        containerMap.addEventListener('click', (e) => {
            if (e.target.closest('.pins')) return;
            scale = 1; translateX = 0; translateY = 0;
            applyTransform();
        });
    }

    // --- Gráfico circular ---
    function setCanvasSize(canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width  = canvas.clientWidth  * dpr;
        canvas.height = canvas.clientHeight * dpr;
        return canvas.getContext('2d');
    }

    function drawBudgetChart() {
        const canvas = document.getElementById('graficoPresupuesto');
        if (!canvas || !canvas.getContext) return;
        const ctx = setCanvasSize(canvas);
        const data = [
            { label: 'Billete de avión',   value: 4200, color: '#f97316' },
            { label: 'Alojamiento',         value: 1890, color: '#2563eb' },
            { label: 'Comida',              value: 1150, color: '#22c55e' },
            { label: 'Emergencias/Propinas',value: 2000, color: '#eab308' },
            { label: 'Tours y entradas',    value:  500, color: '#ec4899' },
            { label: 'Transporte local',    value:  430, color: '#8b5cf6' },
            { label: 'Seguro + Visados',    value:  340, color: '#06b6d4' },
        ];
        const total = data.reduce((s, i) => s + i.value, 0);
        const dpr = window.devicePixelRatio || 1;
        const cx = canvas.width / 2, cy = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 2 - 20 * dpr;
        let angle = -Math.PI / 2;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        data.forEach(item => {
            const slice = (item.value / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, angle, angle + slice);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();
            angle += slice;
        });

        // Leyenda DOM
        const legend = document.getElementById('graficoLegend');
        if (legend) {
            legend.innerHTML = '';
            data.forEach(item => {
                const row = document.createElement('div');
                row.className = 'legend-item';
                const sw = document.createElement('div');
                sw.className = 'legend-swatch';
                sw.style.background = item.color;
                const txt = document.createElement('div');
                txt.textContent = `${item.label} — $${item.value}`;
                row.appendChild(sw);
                row.appendChild(txt);
                legend.appendChild(row);
            });
        }
    }

    drawBudgetChart();
    window.addEventListener('resize', drawBudgetChart);
    hideAllPanels();
});