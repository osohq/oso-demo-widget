import { createNoise2D } from "simplex-noise";

export default function drawElectricity(canvas, fromRect, toRect) {
  const ctx = canvas.getContext("2d");

  const noise = [createNoise2D(), createNoise2D(), createNoise2D()];

  // ctx.strokeRect(fromRect.x, fromRect.y, fromRect.width, fromRect.height);
  // ctx.strokeRect(toRect.x, toRect.y, toRect.width, toRect.height);

  const averageFromX = fromRect.x + fromRect.width / 2;
  const averageToX = toRect.x + toRect.width / 2;
  let stopped = false;

  const diffX = averageToX - averageFromX;
  let direction = "center";
  if (diffX > 10) {
    direction = "right";
  } else if (diffX < -10) {
    direction = "left";
  }

  let fromX, fromY;
  let toX = averageToX;
  let toY = toRect.y;
  if (direction === "center") {
    [fromX, fromY] = [
      fromRect.x + fromRect.width / 2,
      fromRect.y + fromRect.height,
    ];
  } else if (direction === "right") {
    [fromX, fromY] = [
      fromRect.x + fromRect.width,
      fromRect.y + fromRect.height / 2,
    ];
  } else if (direction === "left") {
    [fromX, fromY] = [fromRect.x, fromRect.y + fromRect.height / 2];
  }

  const start = new Date().getTime();

  let draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!canvas.isConnected) return;
    function line(index) {
      const t = new Date().getTime() - start;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = Math.min((t / 500) * 4, 4);
      ctx.beginPath();
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#eeeeffff";
      const midPointX = canvas.width / 2;
      const midPointY = canvas.height / 2;
      let realFromX = undefined;
      let realFromY = undefined;
      let realToX = undefined;
      let realToY = undefined;

      // ctx.strokeRect(fromRect.x, fromRect.y, fromRect.width, fromRect.height);
      // ctx.strokeRect(toRect.x, toRect.y, toRect.width, toRect.height);

      // Animate the lines in from the center
      const startI = Math.max(1 - t / 100, 0.05);
      const endI = Math.min(t / 200, 0.9);

      for (let i = startI; i < endI; i += 0.03) {
        const [x, y] = cubicBezier(
          fromX,
          fromY,
          midPointX,
          midPointY,
          toX,
          toY,
          i
        );

        function getRandom() {
          const y = t / 500;
          const highFreqWeight = 0.4;
          const highFreq = 8;
          return (
            noise[index](i, y) * (1 - highFreqWeight) +
            highFreqWeight * noise[index](i * highFreq, y * highFreq)
          );
        }

        const mult = Math.sin((i * 0.9 + 0.1) * Math.PI);
        const deviance = Math.min(6, (t / 1000) * 6) * mult * mult;
        const amt = getRandom() * deviance;
        const [normalX, normalY] = cubicBezierNormal(
          fromX,
          fromY,
          midPointX,
          midPointY,
          toX,
          toY,
          i
        );
        realToX = x + amt * normalX;
        realToY = y + amt * normalY;
        if (realFromX === undefined) {
          realFromX = realToX;
          realFromY = realToY;
          ctx.moveTo(x, y);
        }
        ctx.lineTo(realToX, realToY);
      }

      ctx.stroke();
      ctx.stroke();
      ctx.fillStyle = "#fff";
      // draw circle at beginning and end
      ctx.beginPath();
      ctx.arc(realFromX, realFromY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(realToX, realToY, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 1; i++) {
      line(i);
    }
    if (!stopped) requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);

  return () => {
    stopped = true;
  };
}

// Formula for bezier curve
function cubicBezier(ax, ay, bx, by, cx, cy, t) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  const x = uuu * ax + 3 * uu * t * bx + 3 * u * tt * cx + ttt * cx;
  const y = uuu * ay + 3 * uu * t * by + 3 * u * tt * cy + ttt * cy;
  return [x, y];
}

function cubicBezierDerivative(ax, ay, bx, by, cx, cy, t) {
  const d1 = { x: 2 * (bx - ax), y: 2 * (by - ay) };
  const d2 = { x: 2 * (cx - bx), y: 2 * (cy - by) };

  const x = (1 - t) * d1.x + t * d2.x;
  const y = (1 - t) * d1.y + t * d2.y;

  return [x, y];
}

function cubicBezierNormal(ax, ay, bx, by, cx, cy, t) {
  const [dx, dy] = cubicBezierDerivative(ax, ay, bx, by, cx, cy, t);
  const q = Math.sqrt(dx * dx + dy * dy);

  const x = -dy / q;
  const y = dx / q;

  return [x, y];
}
