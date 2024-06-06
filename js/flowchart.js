// Se crea una instancia de jsPlumb para manejar las conexiones entre elementos HTML
const jsPlumbInstance = jsPlumb.getInstance();

// Variable para mantener un seguimiento del ID actual de las figuras del diagrama
let currentId = 1;

// Función para agregar una nueva figura al diagrama
function addFigure(type) {
    // Se obtiene el contenedor del diagrama
    const flowchart = document.getElementById('flowchart');
    // Se crea un nuevo elemento div para representar la figura
    const figure = document.createElement('div');
    // Se establece la clase de la figura según el tipo proporcionado
    figure.className = `figure ${type}`;
    // Se asigna un ID único a la figura
    figure.id = `figure-${currentId++}`;

    // Se genera el HTML interno de la figura, incluyendo el texto y los puntos de conexión
    let innerHTML = `${getFigureText(type)}<span style= 'textFigure' class="close-btn">&times;</span>`;
    if (type === 'start') {
        innerHTML += `<div class="ep output-node"></div>`;
    } else if (type === 'end') {
        innerHTML += `<div class="ep input-node"></div>`;
    } else if (type === 'condition' || type === 'loop') {
        innerHTML += `<div class="ep input-nodeC"></div><div class="ep output-nodeC"></div>`;
    } else {
        innerHTML += `<div class="ep input-node"></div><div class="ep output-node"></div>`;
    }

    // Se establece el HTML interno de la figura y su posición inicial
    figure.innerHTML = innerHTML;
    figure.style.left = '10px';
    figure.style.top = '10px';

    // Se agrega la figura al contenedor del diagrama
    flowchart.appendChild(figure);

    // Se hace la figura arrastrable utilizando la biblioteca interact.js
    interact(figure).draggable({
        listeners: {
            // Se activa al comenzar a arrastrar la figura
            start(event) {
                const target = event.target;
                // Se guarda la posición inicial del arrastre
                target.setAttribute('data-start-x', parseFloat(target.getAttribute('data-x')) || 0);
                target.setAttribute('data-start-y', parseFloat(target.getAttribute('data-y')) || 0);
            },
            // Se activa mientras se arrastra la figura
            move(event) {
                const target = event.target;
                const startX = parseFloat(target.getAttribute('data-start-x')) || 0;
                const startY = parseFloat(target.getAttribute('data-start-y')) || 0;
                const x = startX + event.dx;
                const y = startY + event.dy;

                // Se actualiza la posición de la figura y se rota
                target.style.transform = `translate(${x}px, ${y}px), rotate(45deg)`;
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);

                // Se actualiza la posición de las conexiones asociadas
                jsPlumbInstance.revalidate(target);
            },
            // Se activa al soltar la figura
            end(event) {
                const target = event.target;
                const x = parseFloat(target.getAttribute('data-x')) || 0;
                const y = parseFloat(target.getAttribute('data-y')) || 0;

                // Se actualiza la posición inicial de la figura
                target.setAttribute('data-start-x', x);
                target.setAttribute('data-start-y', y);
            }
        },
        // Se aplican modificadores para restringir el arrastre al contenedor
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
            maxConnections: -1 // Se permite un número ilimitado de conexiones salientes
        });
    } else if (type === 'end') {
        jsPlumbInstance.makeTarget(figure.querySelector('.input-node'), {
            anchor: 'Left',
            dropOptions: { hoverClass: 'dragHover' },
            maxConnections: -1 // Se permite un número ilimitado de conexiones entrantes
        });
    } else if (type === 'condition' || type === 'loop') {
        // Se configuran los puntos de conexión para las figuras de condición y bucle
        jsPlumbInstance.makeSource(figure.querySelector('.output-nodeC'), {
            anchor: 'Right',
            connector: ['Flowchart', { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true }],
            connectorStyle: {
                strokeWidth: 2,
                stroke: '#000',
                joinstyle: 'round',
                outlineStroke: 'white',
                outlineWidth: 2
            },
            maxConnections: -1
        });
        jsPlumbInstance.makeTarget(figure.querySelector('.input-nodeC'), {
            anchor: 'Left',
            dropOptions: { hoverClass: 'dragHover' },
            maxConnections: -1
        });
    } else {
        // Se configuran los puntos de conexión para otros tipos de figuras
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
            maxConnections: -1
        });
        jsPlumbInstance.makeTarget(figure.querySelector('.input-node'), {
            anchor: 'Left',
            dropOptions: { hoverClass: 'dragHover' },
            maxConnections: -1
        });
    }

    // Se añade un evento de doble clic para editar el contenido de la figura
    figure.ondblclick = () => editFigure(figure);

    // Se añade un evento de clic al botón de cierre para eliminar la figura
    const closeButton = figure.querySelector('.close-btn');
    closeButton.onclick = (e) => {
        e.stopPropagation();
        removeFigureAndConnections(figure);
    };
}

// Función para obtener el texto correspondiente al tipo de figura
function getFigureText(type) {
    switch (type) {
        case 'start':
            return 'Inicio';
        case 'end':
            return 'Fin';
        case 'operation':
            return 'Operación';
        case 'condition':
            return 'Cond.';
        case 'loop':
            return 'Decl.';
        case 'declare':
            return 'Declarar Variable';
        default:
            return '';
    }
}

// Función para editar el contenido de una figura
function editFigure(figure) {
    const newText = prompt('Editar contenido:', figure.childNodes[0].nodeValue.trim());
    if (newText !== null) {
        figure.childNodes[0].nodeValue = newText;
    }
}

// Función para eliminar una figura y todas las conexiones asociadas
function removeFigureAndConnections(figure) {
    jsPlumbInstance.remove(figure);
    figure.remove();
}

// Evento que se activa cuando el DOM está completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Se configura el contenedor del diagrama
    jsPlumbInstance.setContainer('flowchart');
});

// Función para añadir un botón de eliminar a una conexión
function addDeleteButton(connection) {
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Eliminar';
    deleteButton.className = 'delete-connection-btn';
    deleteButton.onclick = () => {
        jsPlumbInstance.deleteConnection(connection);
        deleteButton.remove();
    };
}

// Evento que se activa cuando se crea una nueva conexión entre figuras
jsPlumbInstance.bind('connection', (info) => {
    // Se añade un botón de eliminar a la nueva conexión
    const connection = info.connection;
    addDeleteButton(connection);
});
