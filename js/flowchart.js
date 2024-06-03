let currentId = 0;
const jsPlumbInstance = jsPlumb.getInstance({
    Connector: ["Flowchart", { cornerRadius: 5 }],
    Anchors: ["Right", "Left"],
    PaintStyle: { stroke: "blue", strokeWidth: 2 },
    Endpoint: "Blank",
    EndpointStyle: { fill: "blue" },
    ConnectorOverlays: [
        ["Arrow", { width: 10, length: 10, location: 1 }]
    ]
});

function addFigure(type) {
    const flowchart = document.getElementById('flowchart');
    const figure = document.createElement('div');
    figure.className = `figure ${type}`;
    figure.id = `figure-${currentId++}`;
    
    let innerHTML = `${getFigureText(type)}<span class="close-btn">&times;</span>`;
    
    if (type === 'start') {
        innerHTML += `<div class="ep output-node"></div>`;
    } else if (type === 'end') {
        innerHTML += `<div class="ep input-node"></div>`;
    } else {
        innerHTML += `<div class="ep input-node"></div><div class="ep output-node"></div>`;
    }

    figure.innerHTML = innerHTML;
    figure.style.left = '10px';
    figure.style.top = '10px';
    flowchart.appendChild(figure);

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
}

function getFigureText(type) {
    switch (type) {
        case 'start':
            return 'Inicio';
        case 'end':
            return 'Fin';
        case 'operation':
            return 'Operación';
        case 'condition':
            return 'Condición';
        case 'loop':
            return 'Ciclo';
        case 'declare':
            return 'Declarar Variable';
        default:
            return '';
    }
}

function editFigure(figure) {
    const newText = prompt('Editar contenido:', figure.innerText.replace('×', ''));
    if (newText !== null) {
        figure.childNodes[0].nodeValue = newText;
    }
}

function removeFigure(figure) {
    jsPlumbInstance.removeAllEndpoints(figure);
    jsPlumbInstance.deleteConnectionsForElement(figure.id); // Asegurar la eliminación de las conexiones
    figure.remove();
}

document.addEventListener('DOMContentLoaded', () => {
    jsPlumbInstance.setContainer('flowchart');
});
