
window.addEventListener('load', () => {
    const savedData = localStorage.getItem('flowchart');
    if (savedData) {
        const { data, connections } = JSON.parse(savedData);
        data.forEach(({ id, type, text, style, x, y }) => {
            const figure = document.createElement('div');
            figure.className = `figure ${type}`;
            figure.id = id;
            let innerHTML = `${text}<span class="close-btn">&times;</span>`;
            if (type === 'start') {
                innerHTML += `<div class="ep output-node"></div>`;
            } else if (type === 'end') {
                innerHTML += `<div class="ep input-node"></div>`;
            } else {
                innerHTML += `<div class="ep input-node"></div><div class="ep output-node"></div>`;
            }
            figure.innerHTML = innerHTML;
            figure.setAttribute('style', style);
            figure.setAttribute('data-x', x);
            figure.setAttribute('data-y', y);
            figure.style.transform = `translate(${x}px, ${y}px)`;
            document.getElementById('flowchart').appendChild(figure);

            interact(figure).draggable({
                listeners: {
                    start(event) {
                        const target = event.target;
                        target.setAttribute('data-start-x', parseFloat(target.getAttribute('data-x')) || 0);
                        target.setAttribute('data-start-y', parseFloat(target.getAttribute('data-y')) || 0);
                    },
                    move(event) {
                        const target = event.target;
                        const startX = parseFloat(target.getAttribute('data-start-x')) || 0;
                        const startY = parseFloat(target.getAttribute('data-start-y')) || 0;
                        const x = startX + event.dx;
                        const y = startY + event.dy;

                        target.style.transform = `translate(${x}px, ${y}px)`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);

                        jsPlumbInstance.revalidate(target);
                    },
                    end(event) {
                        const target = event.target;
                        const x = parseFloat(target.getAttribute('data-x')) || 0;
                        const y = parseFloat(target.getAttribute('data-y')) || 0;

                        target.setAttribute('data-start-x', x);
                        target.setAttribute('data-start-y', y);
                    }
                },
                modifiers: [
                    interact.modifiers.restrict({
                        restriction: 'parent',
                        endOnly: true
                    })
                ]
            });

            jsPlumbInstance.draggable(figure, {
                containment: 'parent'
            });

            if (type === 'start') {
                jsPlumbInstance.makeSource(figure.querySelector('.output-node'), {
                    anchor: 'Right',
                    connector: ['Flowchart', { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true }],
                    connectorStyle: {
                        strokeWidth: 2,
                        stroke: '#000',
                        joinstyle: 'round',
                        outlineStroke: 'white',
                        outlineWidth: 2
                    },
                    maxConnections: 5
                });
            } else if (type === 'end') {
                jsPlumbInstance.makeTarget(figure.querySelector('.input-node'), {
                    anchor: 'Left',
                    dropOptions: { hoverClass: 'dragHover' },
                    maxConnections: 5
                });
            } else {
                jsPlumbInstance.makeSource(figure.querySelector('.output-node'), {
                    anchor: 'Right',
                    connector: ['Flowchart', { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true }],
                    connectorStyle: {
                        strokeWidth: 2,
                        stroke: '#000',
                        joinstyle: 'round',
                        outlineStroke: 'white',
                        outlineWidth: 2
                    },
                    maxConnections: 5
                });
                jsPlumbInstance.makeTarget(figure.querySelector('.input-node'), {
                    anchor: 'Left',
                    dropOptions: { hoverClass: 'dragHover' },
                    maxConnections: 5
                });
            }

            figure.ondblclick = () => editFigure(figure);

            const closeButton = figure.querySelector('.close-btn');
            closeButton.onclick = (e) => {
                e.stopPropagation();
                removeFigure(figure);
            };
        });

        connections.forEach(({ sourceId, targetId, sourceEndpoint, targetEndpoint, anchors }) => {
            jsPlumbInstance.connect({
                source: sourceId,
                target: targetId,
                anchors: anchors,
                endpoints: [sourceEndpoint, targetEndpoint]
            });
        });
    }
});

function removeFigure(figure) {
    jsPlumbInstance.removeAllEndpoints(figure); // Eliminar todos los endpoints y conexiones asociadas
    figure.remove(); // Eliminar el elemento del DOM
}

