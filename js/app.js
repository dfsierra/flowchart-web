// Se añade un evento que se activa cuando la ventana ha cargado completamente
window.addEventListener('load', () => {
    // Se intenta obtener los datos guardados en el almacenamiento local
    const savedData = localStorage.getItem('flowchart');
    if (savedData) {
        // Si se encuentran datos guardados, se parsean y se recuperan las figuras y conexiones
        const { data, connections } = JSON.parse(savedData);
        
        // Se recorren los datos de las figuras
        data.forEach(({ id, type, text, style, x, y }) => {
            // Se crea un elemento div para representar la figura
            const figure = document.createElement('div');
            figure.className = `figure ${type}`;
            figure.id = id;

            // Se genera el HTML interno de la figura, incluyendo el texto y los puntos de conexión
            let innerHTML = `${text}<span class="close-btn">&times;</span>`;
            if (type === 'start') {
                innerHTML += `<div class="ep output-node"></div>`;
            } else if (type === 'end') {
                innerHTML += `<div class="ep input-node"></div>`;
            } else {
                innerHTML += `<div class="ep input-node"></div><div class="ep output-node"></div>`;
            }
            figure.innerHTML = innerHTML;

            // Se establecen los estilos y la posición de la figura
            figure.setAttribute('style', style);
            figure.setAttribute('data-x', x);
            figure.setAttribute('data-y', y);
            figure.style.transform = `translate(${x}px, ${y}px)`;

            // Se añade la figura al contenedor del diagrama
            document.getElementById('flowchart').appendChild(figure);

            // Se hace la figura arrastrable utilizando la biblioteca interact.js
            interact(figure).draggable({
                // Listeners para gestionar el arrastre de la figura
                listeners: {
                    start(event) {
                        const target = event.target;
                        // Se guarda la posición inicial del arrastre
                        target.setAttribute('data-start-x', parseFloat(target.getAttribute('data-x')) || 0);
                        target.setAttribute('data-start-y', parseFloat(target.getAttribute('data-y')) || 0);
                    },
                    move(event) {
                        const target = event.target;
                        const startX = parseFloat(target.getAttribute('data-start-x')) || 0;
                        const startY = parseFloat(target.getAttribute('data-start-y')) || 0;
                        const x = startX + event.dx;
                        const y = startY + event.dy;

                        // Se actualiza la posición de la figura
                        target.style.transform = `translate(${x}px, ${y}px)`;
                        target.setAttribute('data-x', x);
                        target.setAttribute('data-y', y);

                        // Se revalidan las conexiones asociadas
                        jsPlumbInstance.revalidate(target);
                    },
                    end(event) {
                        const target = event.target;
                        const x = parseFloat(target.getAttribute('data-x')) || 0;
                        const y = parseFloat(target.getAttribute('data-y')) || 0;

                        // Se actualiza la posición inicial de la figura
                        target.setAttribute('data-start-x', x);
                        target.setAttribute('data-start-y', y);
                    }
                },
                // Modificadores para restringir el arrastre al contenedor
                modifiers: [
                    interact.modifiers.restrict({
                        restriction: 'parent',
                        endOnly: true
                    })
                ]
            });

            // Se hace la figura arrastrable utilizando la instancia de jsPlumb
            jsPlumbInstance.draggable(figure, {
                containment: 'parent'
            });

            // Se configuran los puntos de conexión de la figura
            if (type === 'start') {
                // Se establece la figura como fuente de conexión saliente
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
                    maxConnections: 5 // Número máximo de conexiones salientes permitidas
                });
            } else if (type === 'end') {
                // Se establece la figura como destino de conexión entrante
                jsPlumbInstance.makeTarget(figure.querySelector('.input-node'), {
                    anchor: 'Left',
                    dropOptions: { hoverClass: 'dragHover' },
                    maxConnections: 5 // Número máximo de conexiones entrantes permitidas
                });
            } else {
                // Se configuran las figuras que no son de inicio ni de fin
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
                    maxConnections: 5 // Número máximo de conexiones salientes permitidas
                });
                jsPlumbInstance.makeTarget(figure.querySelector('.input-node'), {
                    anchor: 'Left',
                    dropOptions: { hoverClass: 'dragHover' },
                    maxConnections: 5 // Número máximo de conexiones entrantes permitidas
                });
            }

            // Se añade un evento de doble clic para editar el contenido de la figura
            figure.ondblclick = () => editFigure(figure);

            // Se añade un evento de clic al botón de cierre para eliminar la figura
            const closeButton = figure.querySelector('.close-btn');
            closeButton.onclick = (e) => {
                e.stopPropagation();
                removeFigure(figure);
            };
        });

        // Se recorren las conexiones guardadas
        connections.forEach(({ sourceId, targetId, sourceEndpoint, targetEndpoint, anchors }) => {
            // Se establecen las conexiones entre las figuras utilizando la instancia de jsPlumb
            jsPlumbInstance.connect({
                source: sourceId,
                target: targetId,
                anchors: anchors,
                endpoints: [sourceEndpoint, targetEndpoint]
            });
        });
    }
});

// Función para eliminar una figura y todas las conexiones asociadas
function removeFigure(figure) {
    jsPlumbInstance.removeAllEndpoints(figure); // Eliminar todos los endpoints y conexiones asociadas
    figure.remove(); // Eliminar el elemento del DOM
}
