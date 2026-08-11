import { useRef, useEffect, useState, useCallback } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import styles from './Whiteboard.module.scss';

const COLORS = ['#0F172A', '#2563EB', '#10B981', '#EF4444', '#F59E0B'];

const Whiteboard = ({ socket, liveClassId }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const [color, setColor] = useState(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(3);
  const strokeHistoryRef = useRef([]); // kept locally so a late joiner can request our state

  const drawSegment = useCallback((from, to, strokeColor, width) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      const prevData = canvas.width ? canvas.toDataURL() : null;
      canvas.width = rect.width;
      canvas.height = 420;
      const ctx = canvas.getContext('2d');
      ctxRef.current = ctx;
      if (prevData) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = prevData;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePointerDown = (e) => {
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  };

  const handlePointerMove = (e) => {
    if (!drawingRef.current) return;
    const point = getPoint(e);
    const from = lastPointRef.current;
    drawSegment(from, point, color, lineWidth);

    const stroke = { from, to: point, color, width: lineWidth };
    strokeHistoryRef.current.push(stroke);
    socket?.emit('whiteboard:draw', { liveClassId, stroke });

    lastPointRef.current = point;
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
  };

  const handleClear = () => {
    const ctx = ctxRef.current;
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    strokeHistoryRef.current = [];
    socket?.emit('whiteboard:clear', { liveClassId });
  };

  // Remote strokes + state sync for late joiners
  useEffect(() => {
    if (!socket) return;

    const handleRemoteDraw = ({ stroke }) => {
      drawSegment(stroke.from, stroke.to, stroke.color, stroke.width);
      strokeHistoryRef.current.push(stroke);
    };

    const handleRemoteClear = () => {
      const ctx = ctxRef.current;
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      strokeHistoryRef.current = [];
    };

    const handleStateRequested = ({ requesterId }) => {
      if (strokeHistoryRef.current.length === 0) return;
      socket.emit('whiteboard:state-response', {
        liveClassId,
        toUserId: requesterId,
        strokes: strokeHistoryRef.current,
      });
    };

    const handleStateSync = ({ strokes }) => {
      strokes.forEach((s) => drawSegment(s.from, s.to, s.color, s.width));
      strokeHistoryRef.current = strokes;
    };

    socket.on('whiteboard:draw', handleRemoteDraw);
    socket.on('whiteboard:clear', handleRemoteClear);
    socket.on('whiteboard:state-requested', handleStateRequested);
    socket.on('whiteboard:state-sync', handleStateSync);

    // Ask the room for existing content the moment we mount (covers joining mid-session).
    socket.emit('whiteboard:request-state', { liveClassId });

    return () => {
      socket.off('whiteboard:draw', handleRemoteDraw);
      socket.off('whiteboard:clear', handleRemoteClear);
      socket.off('whiteboard:state-requested', handleStateRequested);
      socket.off('whiteboard:state-sync', handleStateSync);
    };
  }, [socket, liveClassId, drawSegment]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        {COLORS.map((c) => (
          <button
            key={c}
            className={`${styles.colorSwatch} ${color === c ? styles['colorSwatch--active'] : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
            aria-label={`Color ${c}`}
          />
        ))}
        <input
          type="range"
          min="1"
          max="10"
          value={lineWidth}
          onChange={(e) => setLineWidth(Number(e.target.value))}
          className={styles.widthSlider}
        />
        <button className={styles.clearBtn} onClick={handleClear}>
          <FiTrash2 size={14} /> Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />
    </div>
  );
};

export default Whiteboard;
