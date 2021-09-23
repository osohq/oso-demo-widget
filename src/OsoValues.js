import React from "react";
import { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/prism-light";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import dark from "react-syntax-highlighter/dist/cjs/styles/prism/shades-of-purple";
import { values } from "./values";

const goodColors = {
  background: "rgb(45, 43, 85)",
  comment: "#bc7ff5",
  italic: "#a5ff90",
  link: "#9effff",
};

dark.comment.color = goodColors.comment;
dark.bold.color = goodColors.comment;
dark.italic.color = goodColors.italic;
dark.url.color = goodColors.italic;
dark.url.textDecoration = "none";

SyntaxHighlighter.registerLanguage("markdown", markdown);

const LEARN_MORE_URL = window.LEARN_MORE_URL || "#current-openings";

const Heading = (props) => (
  <h1 {...props}>
    {props.children}
    <style jsx>{`
      h1 {
        font-size: 1.25rem;
        line-height: 1.75rem;
        margin: 0;
        font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont,
          "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans",
          "Helvetica Neue", sans-serif;
      }
    `}</style>
  </h1>
);

function Select(props) {
  return (
    <select
      style={{
        color: "black",
        border: "1px solid",
        borderColor: goodColors.background,
        padding: 2,
        borderRadius: "4px",
        background: "white",
      }}
      {...props}
    />
  );
}

const Button = React.forwardRef(function Button({ small, ...props }, ref) {
  return (
    <button
      ref={ref}
      style={{
        padding: small ? "0.2rem 0.6rem" : "0.25rem 0.75rem",
        borderRadius: 4,
        border: "0 none",
        fontSize: small ? "14px" : "16px",
        cursor: "pointer",
        lineHeight: small ? "1.35" : "1.15",
        color: "white",
      }}
      {...props}
    />
  );
});

export default function OsoValues() {
  const valueNames = Object.keys(values);
  const [selectedValueName, setSelectedValueName] = useState(valueNames[0]);
  const selectedValue = values[selectedValueName];

  const nextValueName = valueNames[valueNames.indexOf(selectedValueName) + 1];

  return (
    <div
      className="oso-widget"
      style={{
        minHeight: 500,
        maxHeight: 500,
        position: "relative",
      }}
    >
      <style jsx>{`
        .oso-widget {
          display: flex;
          align-items: stretch;
          -webkit-font-smoothing: antialiased;
          font-family: ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
            "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", "Noto Color Emoji";
        }

        .policy-container {
          color: rgb(229, 231, 235);
          border-radius: 0.5rem;
          padding: 1.5rem;
          padding-right: 5rem;

          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .policy-container :global(h1) {
          color: rgb(229, 231, 235);
        }

        .policy-selector {
          display: flex;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        :global(.next) {
          background-color: rgb(59, 130, 246);
        }

        :global(.next):hover {
          background-color: rgb(96, 165, 250);
        }

        .ml-3 {
          margin-left: 0.75rem;
        }

        .pb-4 {
          padding-bottom: 1rem;
        }
        .pb-2 {
          padding-bottom: 0.5rem;
        }

        .code {
          position: relative;
          overflow: hidden;
        }

        .code :global(pre) {
          overflow: auto;
          font-size: 1rem;
          line-height: 1.5rem;
          height: 100%;
        }

        .code :global(code) {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
        }

        .shadow {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 60px;
          background: linear-gradient(#2d2b5500, #2d2b55);
        }

        @media screen and (max-width: 640px) {
          .policy-container {
            padding-right: 1.5rem;
            width: 100%;
          }

          .code :global(pre) {
            font-size: 0.75rem;
            line-height: 1rem;
          }

          .demo-app-container {
            display: none;
          }
        }

        .prompt img {
          max-width: 100%;
        }
      `}</style>
      <div
        className="policy-container"
        style={{ background: goodColors.background }}
      >
        <div className="policy-selector">
          <Heading>Value:</Heading>
          <div className="ml-3">
            <Select
              value={selectedValueName}
              onChange={(e) => setSelectedValueName(e.target.value)}
            >
              {Object.entries(values).map(([name, value]) => (
                <option value={name} key={name}>
                  {value.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="ml-3">
            {nextValueName ? (
              <Button
                className="next"
                onClick={() => setSelectedValueName(nextValueName)}
              >
                Next
              </Button>
            ) : (
              <a href={LEARN_MORE_URL}>
                <Button className="next">Try it &rarr;</Button>
              </a>
            )}
          </div>
        </div>
        <div className="code">
          <SyntaxHighlighter
            customStyle={{
              padding: "0 0 60px",
              margin: 0,
              overflow: "auto",
              backgroundColor: goodColors.background,
            }}
            language="markdown"
            style={dark}
          >
            {selectedValue.polar}
          </SyntaxHighlighter>
          <div className="shadow" />
        </div>
      </div>
    </div>
  );
}
