import React, { useEffect, useState } from "react";
import { STROKES, NONE, BLACK, TRANSPARENT, GRID_SIZE } from "../constants.js";
import { OPACITY_FULL, OPACITY_NONE } from "../constants.js";
import {
  getPointsCenter,
  getBalancedDash,
  getPointsDistance,
} from "../utils/math.js";
import shapeit from "shapeit/src";
import { SimpleLine } from "./ShapeElement.jsx";

import { useBoard } from "../contexts/BoardContext.jsx";

const getPath = (points) => {
  let lastPoint = points[0];
  const commands = [`M${lastPoint[0]},${lastPoint[1]}`];
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    const center = getPointsCenter(lastPoint, point);
    commands.push(`Q${lastPoint[0]},${lastPoint[1]} ${center[0]},${center[1]}`);
    lastPoint = point;
  }
  commands.push(`L${lastPoint[0]},${lastPoint[1]}`);
  return commands.join(" ");
};

export const DrawElement = (props) => {
  const board = useBoard();

  const [newPath, setNewPath] = useState();
  const [currFigure, setCurrFigure] = useState();
  const [connect, setConnect] = useState(false);

  const width = Math.abs(props.x2 - props.x1);
  const height = Math.abs(props.y2 - props.y1);
  const points = props.points || [];
  const strokeWidth = props.strokeWidth ?? 0;

  const path = React.useMemo(
    () => getPath(points),
    [points.length, props.creating]
  );

  const strokeOpacity =
    props.strokeStyle === STROKES.NONE ? OPACITY_NONE : OPACITY_FULL;
  const [strokeDasharray, strokeDashoffset] = React.useMemo(() => {
    const strokeStyle = props.strokeStyle;
    if (strokeStyle === STROKES.DASHED || strokeStyle === STROKES.DOTTED) {
      const length = getPointsDistance(...points);
      return getBalancedDash(length, strokeWidth, strokeStyle);
    }
    return [NONE, NONE];
  }, [points.length, strokeWidth, props.strokeStyle]);

  const detectAndDraw = () => {
    let currPoints = [...points];
    let lastElement = currPoints[currPoints.length - 1];

    const distance = Math.sqrt(
      Math.pow(lastElement[0] - currPoints[0][0], 2) +
        Math.pow(lastElement[1] - currPoints[0][1], 2)
    );

    const maxDistanceThreshold = 50;

    if (distance <= maxDistanceThreshold) {
      currPoints = [...currPoints, currPoints[0]];
      setConnect(true);
    } else {
      setConnect(false);
    }

    const prettyFigure = shapeit(currPoints);
    setCurrFigure(prettyFigure);

    
    if (prettyFigure.length >= 3) {
      setNewPath(getPath(prettyFigure));
      if (prettyFigure.name !== "vector") {
        board.addText(prettyFigure.name);
      }
    }
  };

  useEffect(() => {
    detectAndDraw();
  }, [points]);

  useEffect(() => {
    if (board.removeState) {
      setConnect(false);
      board.setRemoveState(false);
    }
  }, [board.removeState]);

  console.log(currFigure);

  return (
    <g transform={`translate(${props.x1},${props.y1})`} opacity={props.opacity}>
      <g
        transform={`scale(${width / props.drawWidth} ${
          height / props.drawHeight
        })`}
      >
        <rect
          x={-GRID_SIZE / 2}
          y={-GRID_SIZE / 2}
          width={Math.abs(props.x2 - props.x1) + GRID_SIZE}
          height={Math.abs(props.y2 - props.y1) + GRID_SIZE}
          fill={NONE}
          stroke={NONE}
        />
        {currFigure && currFigure.name === "circle" ? (
          <>
            <ellipse
              cx={currFigure.center[0]}
              cy={currFigure.center[1]}
              rx={currFigure.center[0]}
              ry={currFigure.center[1]}
              fill={NONE}
              stroke={props.strokeColor}
              strokeWidth={props.strokeWidth}
              strokeOpacity={strokeOpacity}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : currFigure && currFigure.length >= 3 ? (
          <>
            {currFigure.map((path, index) => (
              <SimpleLine
                key={index}
                x1={path[0]}
                y1={path[1]}
                x2={
                  index === currFigure.length - 1 && connect
                    ? currFigure[0][0]
                    : index === currFigure.length - 1 && !connect
                    ? path[0]
                    : currFigure[index + 1][0]
                }
                y2={
                  index === currFigure.length - 1 && connect
                    ? currFigure[0][1]
                    : index === currFigure.length - 1 && !connect
                    ? path[1]
                    : currFigure[index + 1][1]
                }
                strokeColor={props.strokeColor}
                strokeWidth={props.strokeWidth}
                strokeStyle={props.strokeStyle}
              />
            ))}
          </>
        ) : (
          <path
            data-element={props.id}
            d={newPath ?? path}
            fill={NONE}
            stroke={props.strokeColor ?? BLACK}
            strokeWidth={strokeWidth}
            strokeOpacity={strokeOpacity}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            strokeLinejoin="round"
            onPointerDown={props.onPointerDown}
          />
        )}
      </g>

      <rect
        data-element={props.id}
        x="0"
        y="0"
        width={Math.abs(props.x2 - props.x1)}
        height={Math.abs(props.y2 - props.y1)}
        fill={TRANSPARENT}
        stroke={NONE}
        onPointerDown={props.onPointerDown}
      />
    </g>
  );
};
