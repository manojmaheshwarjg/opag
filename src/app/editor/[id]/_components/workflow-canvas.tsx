
'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import 'jointjs/dist/joint.css';

type WorkflowCanvasProps = {
    initialGraphData: any;
    graphRef: React.MutableRefObject<any>;
    paperRef: React.MutableRefObject<any>;
    onSelectionChange: (cell: any | null) => void;
    onNodesChange: (nodes: any[]) => void;
    onDoubleClick: (cellView: any) => void;
    onDrop: (data: any, position: {x: number, y: number}) => void;
};

export const WorkflowCanvas = ({
    initialGraphData,
    graphRef,
    paperRef,
    onSelectionChange,
    onNodesChange,
    onDoubleClick,
    onDrop
}: WorkflowCanvasProps) => {
    const canvasElRef = useRef<HTMLDivElement>(null);
    const isMountedRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;
        let localPaper: any;
        let localGraph: any;
        let selection: any[] = [];
        let panStartX: number, panStartY: number;
        
        let onMouseUp: ((e: MouseEvent) => void) | null = null;
        let onMouseMove: ((e: MouseEvent) => void) | null = null;
        
        const initializeJointJS = async () => {
            const joint = await import('jointjs');
            (window as any).joint = joint;

            if (!isMountedRef.current || !canvasElRef.current) return;

            localGraph = new joint.dia.Graph({}, { cellNamespace: joint.shapes });
            graphRef.current = localGraph;

            localPaper = new joint.dia.Paper({
                el: canvasElRef.current,
                model: localGraph,
                width: '100%',
                height: '100%',
                gridSize: 20,
                drawGrid: {
                    name: 'dot',
                    args: { color: 'hsl(var(--border))' }
                },
                background: {
                    color: 'hsl(var(--background))'
                },
                cellViewNamespace: joint.shapes,
                interactive: (cellView) => {
                    if (cellView.model.isLink()) {
                        return { linkMove: true };
                    }
                     // Disable moving elements by their body, but allow interaction with ports
                    if (cellView.el.getAttribute('magnet')) {
                        return { elementMove: false };
                    }
                    return true;
                },
                defaultLink: () => new joint.shapes.standard.Link({
                    attrs: {
                        line: {
                            stroke: 'hsl(var(--muted-foreground))',
                            strokeWidth: 2,
                            targetMarker: { 'type': 'path', 'd': 'M 6 -3 L 0 0 L 6 3 z', 'fill': 'hsl(var(--muted-foreground))', 'stroke': 'none' }
                        }
                    },
                    router: { name: 'manhattan' },
                    connector: { name: 'rounded' }
                }),
                 validateConnection: function(cellViewS, magnetS, cellViewT, magnetT) {
                    // Prevent linking from input ports.
                    if (magnetS && magnetS.getAttribute('port-group') === 'in') return false;
                    // Prevent linking from output ports to input ports on the same element.
                    if (cellViewS === cellViewT) return false;
                    // Prevent linking to input ports.
                    return magnetT && magnetT.getAttribute('port-group') === 'in';
                },
                markAvailable: true,
            });
            paperRef.current = localPaper;

            const selectionHighlighter = {
                name: 'stroke',
                options: {
                    padding: 6,
                    rx: 8,
                    ry: 8,
                    attrs: { 'stroke-width': 3, stroke: 'hsl(var(--primary))' }
                }
            };
            
            const clearSelection = () => {
                 selection.forEach(cell => {
                    const view = localPaper.findViewByModel(cell);
                    if(view) view.unhighlight(undefined, selectionHighlighter);
                });
                selection = [];
                onSelectionChange(null);
            };

            const selectCell = (cell: any, shiftKey: boolean) => {
                if (!shiftKey) {
                    clearSelection();
                }
                const view = localPaper.findViewByModel(cell);
                if (view) {
                    const idx = selection.indexOf(cell);
                    if (idx > -1) {
                         view.unhighlight(undefined, selectionHighlighter);
                         selection.splice(idx, 1);
                    } else {
                        view.highlight(undefined, selectionHighlighter);
                        selection.push(cell);
                    }
                }
                onSelectionChange(selection.length === 1 ? selection[0] : null);
            };
            
            localPaper.on('element:pointerclick', (elementView: any, evt: any) => {
                selectCell(elementView.model, evt.shiftKey || evt.ctrlKey || evt.metaKey);
            });
            
            onMouseMove = (e: MouseEvent) => {
                if (localPaper) {
                    localPaper.translate(
                        e.clientX - panStartX,
                        e.clientY - panStartY
                    );
                }
            };

            onMouseUp = (e: MouseEvent) => {
                localPaper.el.style.cursor = 'default';
                if(onMouseMove) window.removeEventListener('mousemove', onMouseMove);
                if(onMouseUp) window.removeEventListener('mouseup', onMouseUp);
            };

            localPaper.on('blank:pointerdown', (evt: any) => {
                if (evt.shiftKey) {
                    // Rubber-band selection logic can go here
                } else {
                    clearSelection();
                    panStartX = evt.clientX;
                    panStartY = evt.clientY;
                    localPaper.el.style.cursor = 'grabbing';
                    if(onMouseMove) window.addEventListener('mousemove', onMouseMove);
                    if(onMouseUp) window.addEventListener('mouseup', onMouseUp);
                }
            });
            
            localPaper.on('mousewheel', (evt: any, x: number, y: number, delta: number) => {
                evt.preventDefault();
                const scale = Math.pow(1.1, delta);
                paperRef.current.scale(scale, scale, x, y);
            });

            localPaper.on('element:pointerdblclick', (elementView: any) => onDoubleClick(elementView));
            
            localGraph.on('add remove reset', () => {
                if (isMountedRef.current) {
                    onNodesChange([...localGraph.getElements()]);
                }
            });


            if (initialGraphData) {
                localGraph.fromJSON(initialGraphData);
            }
        };

        initializeJointJS();

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = 'copy';
        };

        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            const stepData = e.dataTransfer!.getData('application/json');
            if (stepData) {
                const step = JSON.parse(stepData);
                const coords = paperRef.current.clientToLocalPoint({ x: e.clientX, y: e.clientY });
                onDrop(step, coords);
            }
        };
        
        const canvasEl = canvasElRef.current;
        if (canvasEl) {
            canvasEl.addEventListener('dragover', handleDragOver);
            canvasEl.addEventListener('drop', handleDrop);
        }

        return () => {
            isMountedRef.current = false;
            if(onMouseMove) window.removeEventListener('mousemove', onMouseMove);
            if(onMouseUp) window.removeEventListener('mouseup', onMouseUp);

            if (canvasEl) {
                canvasEl.removeEventListener('dragover', handleDragOver);
                canvasEl.removeEventListener('drop', handleDrop);
            }

            if (localPaper) {
                localPaper.remove();
            }
            if (localGraph) {
                localGraph.clear();
            }
            graphRef.current = null;
            paperRef.current = null;
            if((window as any).joint) {
                delete (window as any).joint;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialGraphData]); 

    return <div ref={canvasElRef} className="h-full w-full" />;
};

    