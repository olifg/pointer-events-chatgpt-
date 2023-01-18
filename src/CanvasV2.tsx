import React, { useRef } from 'react';

function detectPointers(canvas: HTMLCanvasElement) {
    let pointers: { [pointerId: number]: PointerEvent } = {};

    canvas.addEventListener('pointerdown', (event: PointerEvent) => {
        pointers[event.pointerId] = event;
        renderPointers(canvas, pointers);
    });

    canvas.addEventListener('pointermove', (event: PointerEvent) => {
        pointers[event.pointerId] = event;
        renderPointers(canvas, pointers);
    });

    canvas.addEventListener('pointerup', (event: PointerEvent) => {
        delete pointers[event.pointerId];
        clearPointers(canvas);
        pointers = {}
    });
}

function clearPointers(canvas: HTMLCanvasElement) {
    let ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function calculateDistance(pointer1: PointerEvent, pointer2: PointerEvent) {
    return Math.sqrt((pointer1.clientX - pointer2.clientX) ** 2 + (pointer1.clientY - pointer2.clientY) ** 2);
}

function renderPointers(canvas: HTMLCanvasElement, pointers: { [pointerId: number]: PointerEvent }) {
    let ctx = canvas.getContext('2d');
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pointers
    for (let pointerId in pointers) {
        let pointer = pointers[pointerId];
        ctx.beginPath();
        ctx.arc(pointer.clientX, pointer.clientY, 10, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
        ctx.fillText(`PointerId: ${pointerId}`, pointer.clientX, pointer.clientY);
    }

    // Draw lines and distance between pointers
    for (let pointerId in pointers) {
        let pointer = pointers[pointerId];
        for (let pointerId2 in pointers) {
            if (pointerId < pointerId2) {
                let pointer2 = pointers[pointerId2];
                // let distance = calculateDistance(pointer, pointer2);
                ctx.beginPath();
                ctx.moveTo(pointer.clientX, pointer.clientY);
                ctx.lineTo(pointer2.clientX, pointer2.clientY);
                ctx.strokeStyle = 'black';
                ctx.stroke();
            }
        }
    }

    // Draw table
    let tableRows: { pointerId: string, pointerId2: string, distance: number }[] = [];
    for (let pointerId in pointers) {
        let pointer = pointers[pointerId];
        for (let pointerId2 in pointers) {
            if (pointerId < pointerId2) {
                let pointer2 = pointers[pointerId2];
                let distance = calculateDistance(pointer, pointer2);
                tableRows.push({ pointerId, pointerId2, distance });
            }
        }
    }
    let x = 10;
    let y = canvas.height - 350;
    let rowHeight = 20;
    ctx.fillStyle = 'black';
    ctx.fillText("Pointer IDs", x, y);
    ctx.fillText("Distance", x + 150, y);
    y += rowHeight;
    tableRows.forEach((row) => {
        if (!ctx) return
        ctx.fillText(`${row.pointerId} - ${row.pointerId2}`, x, y);
        ctx.fillText(`${row.distance.toFixed(2)} px`, x + 150, y);
        y += rowHeight;
    });
}

///DETECT GESTURE



export const PointerCanvas = (props: { width: number, height: number }) => {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (canvasRef.current) {
            detectPointers(canvasRef.current);
        }
    }, []);

    return (
        <div>
            <canvas ref={canvasRef} width={props.width} height={props.height} />
        </div>
    );
}
