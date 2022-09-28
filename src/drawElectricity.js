export default function drawElectricity(canvas, fromRect, toRect) {
  const ctx = canvas.getContext("2d");

  // ctx.strokeRect(fromRect.x, fromRect.y, fromRect.width, fromRect.height);
  // ctx.strokeRect(toRect.x, toRect.y, toRect.width, toRect.height);

  const averageFromX = fromRect.x + fromRect.width / 2;
  const averageToX = toRect.x + toRect.width / 2;

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

  let draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!canvas.isConnected) return;
    function line() {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#eeeeff99";
      const midPointX = canvas.width / 2;
      const midPointY = canvas.height / 2;
      let realFromX = undefined;
      let realFromY = undefined;
      let realToX = undefined;
      let realToY = undefined;

      // ctx.strokeRect(fromRect.x, fromRect.y, fromRect.width, fromRect.height);
      // ctx.strokeRect(toRect.x, toRect.y, toRect.width, toRect.height);

      for (let i = 0.05; i < 0.9; i += 0.09) {
        const [x, y] = cubicBezier(
          fromX,
          fromY,
          midPointX,
          midPointY,
          toX,
          toY,
          i
        );
        if (realFromX === undefined) {
          realFromX = x;
          realFromY = y;
          ctx.moveTo(x, y);
        }
        const mult = Math.sin(i * Math.PI);
        const deviance = 10 * mult * mult;
        const devX = (Math.random() * 1 - 0.5) * deviance;
        const devY = (Math.random() * 1 - 0.5) * deviance;
        ctx.lineTo(x + devX, y + devY);
        realToX = x + devX;
        realToY = y + devY;
      }

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
    for (let i = 0; i < 3; i++) {
      line();
    }
    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
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
