import { DiceRoll } from "@dice-roller/rpg-dice-roller";
import { css } from "@emotion/css";
import Box from "@mui/material/Box";
import Grow from "@mui/material/Grow";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { ContentEditable } from "../../../../components/ContentEditable/ContentEditable";
import { Delays } from "../../../../constants/Delays";
import { FontFamily } from "../../../../constants/FontFamily";
import { useZIndex } from "../../../../constants/zIndex";
import { ThemedLabel } from "../../../Character/components/CharacterDialog/components/ThemedLabel";
import {
  MiniThemeContext,
  useMiniTheme,
} from "../../../Character/components/CharacterDialog/MiniThemeContext";
import { DefaultPlayerColor } from "../../consts/PlayerColors";
import { IPlayerCursorRollOutput } from "../../types/IPlayerCursorState";

let topTenLatestRollCommandsSingleton: Array<string> = [];

let openCount = -1;
export default function CursorWithMessage(props: {
  color: string | null | undefined;
  x: number;
  y: number;
  message: string | null | undefined;
  rollOutput: IPlayerCursorRollOutput | null | undefined;
  readonly?: boolean;
  label: string | null | undefined;
  onRollOutputChange?(roll: IPlayerCursorRollOutput | null): void;
  onMessageChange?(message: string): void;
}) {
  const [textPlaceholder] = useState(() => {
    ++openCount;
    if (openCount % 2 === 0) {
      return "Type a message...";
    }
    return "2d6 + 3";
  });
  const zIndex = useZIndex();
  const theme = useTheme();
  const color = props.color || DefaultPlayerColor;
  const miniTheme = useMiniTheme({
    enforceBackground: color,
  });
  const textColor = theme.palette.getContrastText(color);
  const [topTenLatestRollCommands, setTopTenLatestRollCommands] =
    React.useState<Array<string>>(topTenLatestRollCommandsSingleton);
  const [commandToPopIndex, setCommandtoPopIndex] = React.useState(0);
  const shouldRenderPopover =
    props.message || props.rollOutput || !props.readonly;

  const [hasDiceError, setHasDiceError] = useState(false);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    setStale(false);

    const timeout = setTimeout(() => {
      setStale(true);
    }, Delays.cursorStale);

    return () => {
      clearTimeout(timeout);
    };
  }, [props.x, props.y, props.message, props.rollOutput, props.label]);

  useEffect(() => {
    topTenLatestRollCommandsSingleton = topTenLatestRollCommands;
  }, [topTenLatestRollCommands]);

  function handleDiceRoll() {
    try {
      const command = props.message || "";
      const roll = new DiceRoll(command);
      props.onRollOutputChange?.({
        text: roll.output,
        total: roll.total.toString(),
      });
      const newCommands = [command, ...topTenLatestRollCommands].slice(0, 10);
      const uniqueCommandsArray = Array.from(new Set(newCommands));
      setTopTenLatestRollCommands(uniqueCommandsArray);
      setCommandtoPopIndex(0);
    } catch (error) {
      setHasDiceError(true);
    }
  }

  function handleMessageChange(message: string) {
    props.onMessageChange?.(message);
    setCommandtoPopIndex(0);
  }

  function handleRollHistoryPrevious() {
    const poppedCommand = topTenLatestRollCommands[commandToPopIndex];
    if (poppedCommand) {
      props.onMessageChange?.(poppedCommand);
      const newIndex = Math.min(
        commandToPopIndex + 1,
        topTenLatestRollCommands.length - 1
      );
      setCommandtoPopIndex(newIndex);
    }
  }

  function handleRollHistoryNext() {
    const poppedCommand = topTenLatestRollCommands[commandToPopIndex];
    if (poppedCommand) {
      props.onMessageChange?.(poppedCommand);
      const newIndex = Math.max(commandToPopIndex - 1, 0);
      setCommandtoPopIndex(newIndex);
    }
  }
  const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;

  return (
    <MiniThemeContext.Provider value={miniTheme}>
      <div
        className={css({
          label: "CursorWithMessage",
          position: "absolute",
          opacity: stale ? 0.15 : 1,
          pointerEvents: "none",

          zIndex: zIndex.cursor,
        })}
        style={{
          transition: isFirefox
            ? undefined
            : "transform 0.5s cubic-bezier(.17,.93,.38,1)",
          transform: `translateX(${props.x}px) translateY(${props.y}px) scale(1)`,
        }}
      >
        {props.readonly && renderCursor()}

        <Grow in={!!shouldRenderPopover}>{renderPopover()}</Grow>
      </div>
    </MiniThemeContext.Provider>
  );

  function renderCursor() {
    return (
      <svg
        className={css({
          position: "relative",
          width: "4rem",
          height: "4rem",
        })}
        width="24"
        height="36"
        viewBox="0 0 24 36"
        fill="none"
        stroke="white"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={color}
        />
      </svg>
    );
  }

  function renderPopover() {
    return (
      <div
        className={css({
          position: "absolute",
          top: "0rem",
          left: "3rem",
          padding: "1rem",
        })}
        style={{ backgroundColor: color, borderRadius: 4 }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: "flex",
              color: textColor,
            }}
          >
            {props.label}
          </Typography>
        </Box>
        <ThemedLabel
          className={css({
            fontSize: "1.5rem",
          })}
        >
          <ContentEditable
            autoFocus
            className={css({
              color: textColor,
              background: "transparent",
              outline: "none",
              minWidth: "15rem",
              maxHeight: "10rem",
              overflow: "hidden",
            })}
            noDelay
            value={props.message || ""}
            onChange={(message) => {
              handleMessageChange(message);
            }}
            border
            borderColor={
              hasDiceError ? miniTheme.muiTheme.palette.error.main : textColor
            }
            onKeyDown={(e) => {
              setHasDiceError(false);
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                handleDiceRoll();
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                handleRollHistoryPrevious();
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();
                handleRollHistoryNext();
              }
            }}
            readonly={props.readonly}
            placeholder={textPlaceholder}
          />
        </ThemedLabel>
        {!props.readonly && (
          <Box pt=".5rem">
            <Typography
              variant="caption"
              gutterBottom
              sx={{ color: textColor, display: "block" }}
            >
              Press <KeyboardKey>Esc or /</KeyboardKey>
              {" to close"}
            </Typography>
            <Typography
              variant="caption"
              gutterBottom
              sx={{ color: textColor, display: "block" }}
            >
              Press <KeyboardKey>Enter</KeyboardKey>
              {" to roll dice command."}
            </Typography>
          </Box>
        )}
        {renderRollOutput()}
      </div>
    );
  }

  function renderRollOutput() {
    return (
      <Grow in={!!props.rollOutput}>
        <Box>
          {props.rollOutput && (
            <Box
              py=".5rem"
              sx={{
                padding: ".5rem",
                marginTop: ".5rem",
                background: "#fff",
                fontSize: "1.5rem",
                fontFamily: FontFamily.Console,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "2rem",
                    color: "#000",
                  }}
                  variant="caption"
                >
                  {props.rollOutput?.total}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    color: "#000",
                  }}
                  variant="caption"
                >
                  {props.rollOutput?.text}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Grow>
    );
  }
}

function KeyboardKey(props: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "inline-block",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "0.1em 0.5em",
        margin: "0 0.2em",
        color: "#000",
        boxShadow: "0 1px 0px rgba(0, 0, 0, 0.2), 0 0 0 2px #fff inset",
        backgroundColor: "#f7f7f7",
      }}
    >
      {props.children}
    </Box>
  );
}
