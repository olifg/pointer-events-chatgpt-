import React, { useRef, useEffect } from 'react';

interface CanvasProps {
    width: number;
    height: number;
}

export const Canvas: React.FC<CanvasProps> = ({ width, height }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        let pointerPositions = new Map<number, { x: number, y: number }>();
        let lastPointer1 = { x: 0, y: 0 };
        let lastPointer2 = { x: 0, y: 0 };
        let lastTimestamp = 0;

        let panning = false;
        let pinching = false;
        let pinchStartDistance = 0;
        let idle = true;
        let lastGestureTimestamp = 0;
        let IDLE_THRESHOLD = 100;
        let PAN_THRESHOLD = 5;
        let PINCH_THRESHOLD = 100;
        let acceleration = 0;

        function clearState() {

            pointerPositions.clear();

            lastPointer1 = { x: 0, y: 0 };
            lastPointer2 = { x: 0, y: 0 };
            lastTimestamp = 0;

            panning = false;
            pinching = false;
            pinchStartDistance = 0;
            idle = true;
            lastGestureTimestamp = 0;
            acceleration = 0;

        }


        function renderPointers() {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            ctx.font = '48px serif';
            pointerPositions.forEach((position, pointerId) => {
                ctx.fillStyle = "red";
                ctx.beginPath();
                ctx.arc(position.x, position.y, 10, 0, 2 * Math.PI);
                ctx.fill();
                ctx.fillStyle = "black";
                ctx.fillText(pointerId.toString(), position.x + 20, position.y);
            });
            if (pointerPositions.size === 2) {
                let [pointer1, pointer2] = Array.from(pointerPositions.values());
                let distance = Math.sqrt((pointer1.x - pointer2.x) ** 2 + (pointer1.y - pointer2.y) ** 2);
                ctx.beginPath();
                ctx.moveTo(pointer1.x, pointer1.y);
                ctx.lineTo(pointer2.x, pointer2.y);
                ctx.stroke();
                ctx.fillText(`Distance: ${distance.toFixed(2)}px`, pointer1.x + (pointer2.x - pointer1.x) / 2, pointer1.y + (pointer2.y - pointer1.y) / 2);
                let currentTimestamp = performance.now();
                if (lastTimestamp !== 0) {
                    let dt = (currentTimestamp - lastTimestamp) / 1000;
                    acceleration = calculateCombinedAcceleration(pointer1, lastPointer1, pointer2, lastPointer2, dt);
                    detectGesture();
                    renderData();
                }
                lastTimestamp = currentTimestamp;

                lastPointer1 = pointer1;
                lastPointer2 = pointer2;
            }
        }

        function renderData() {
            if (!ctx) return;
            ctx.fillText(`Combined Acceleration: ${acceleration.toFixed(2)} px/s`, 10, height - 10);
            detectGesture();
            ctx.fillText(`Current gesture: ${panning ? 'Panning' : pinching ? 'Pinching' : 'Idle'}`, 10, height - 30);
        }

        const doStuff = () => {
            renderPointers();
        }



        function calculateCombinedAcceleration(pointer1: { x: number; y: number; }, lastPointer1: { x: number; y: number; }, pointer2: { x: number; y: number; }, lastPointer2: { x: number; y: number; }, dt: number) {
            if (dt > 0.05) {
                return 0;
            }
            let accelerationX1 = (pointer1.x - lastPointer1.x) / dt;
            let accelerationY1 = (pointer1.y - lastPointer1.y) / dt;
            let accelerationX2 = (pointer2.x - lastPointer2.x) / dt;
            let accelerationY2 = (pointer2.y - lastPointer2.y) / dt;
            let combinedAcceleration = Math.sqrt((accelerationX1 + accelerationX2) ** 2 + (accelerationY1 + accelerationY2) ** 2)
            return combinedAcceleration;
        }

        function detectGesture() {



            let currentTimestamp = performance.now();
            if (pointerPositions.size === 2) {
                let [pointer1, pointer2] = Array.from(pointerPositions.values());
                let currentDistance = Math.sqrt((pointer1.x - pointer2.x) ** 2 + (pointer1.y - pointer2.y) ** 2);

                if (!panning && !pinching && idle) {
                    // First time detecting gesture
                    if (Math.abs(pointer1.x - lastPointer1.x) > PAN_THRESHOLD ||
                        Math.abs(pointer1.y - lastPointer1.y) > PAN_THRESHOLD ||
                        Math.abs(pointer2.x - lastPointer2.x) > PAN_THRESHOLD ||
                        Math.abs(pointer2.y - lastPointer2.y) > PAN_THRESHOLD) {
                        panning = true;
                        idle = false;
                        lastGestureTimestamp = currentTimestamp;
                    } else {
                        idle = false;
                        pinching = true;
                        lastGestureTimestamp = currentTimestamp;
                    }
                } else if (panning) {
                    // Check if gesture changed to pinch or idle
                    if (Math.abs(currentDistance - pinchStartDistance) > PINCH_THRESHOLD) {
                        panning = false;
                        pinching = true;
                        idle = false;
                        pinchStartDistance = currentDistance;
                        lastGestureTimestamp = currentTimestamp;
                    } else if (currentTimestamp - lastGestureTimestamp > IDLE_THRESHOLD) {
                        panning = false;
                        pinching = false;
                        idle = true;
                        lastGestureTimestamp = currentTimestamp;
                    }
                } else if (pinching) {
                    // Check if gesture changed to pan or idle
                    if (Math.abs(pointer1.x - lastPointer1.x) > PAN_THRESHOLD ||
                        Math.abs(pointer1.y - lastPointer1.y) > PAN_THRESHOLD ||
                        Math.abs(pointer2.x - lastPointer2.x) > PAN_THRESHOLD ||
                        Math.abs(pointer2.y - lastPointer2.y) > PAN_THRESHOLD) {
                        panning = true;
                        pinching = false;
                        idle = false;
                        lastGestureTimestamp = currentTimestamp;
                    } else if (currentTimestamp - lastGestureTimestamp > IDLE_THRESHOLD) {
                        panning = false;
                        pinching = false;
                        idle = true;
                        lastGestureTimestamp = currentTimestamp;
                    }
                }
            } else {
                panning = false;
                pinching = false;
                idle = true;
            }
        }






        canvas.addEventListener('pointerdown', (event: PointerEvent) => {
            pointerPositions.set(event.pointerId, { x: event.clientX, y: event.clientY });
            renderPointers();
        });

        canvas.addEventListener('pointerup', (event: PointerEvent) => {
            pointerPositions.delete(event.pointerId);
            clearState();
        });

        canvas.addEventListener('pointermove', (event: PointerEvent) => {
            pointerPositions.set(event.pointerId, { x: event.clientX, y: event.clientY });
            renderPointers();
        });



    }, [width, height]);





    const animationFrameId = useRef(0);


    return <canvas ref={canvasRef} />;
}