import React, { useCallback, useEffect } from "react";
import arrows from "./arrows.svg";
import {
  HiChatAlt,
  HiCheck,
  HiDocument,
  HiOutlineChatAlt,
  HiOutlineDocument,
  HiUser,
  HiX,
} from "react-icons/hi";
import { MdCorporateFare, MdDescription } from "react-icons/md";
import { useListTransition } from "transition-hook";
import drawElectricity from "./drawElectricity";
import tinycolor from "tinycolor2";

const colors = {
  success: "#24da78",
  danger: "#da2424",
  warning: "#ff9f1c",
  primary1: "#392396",
  primary2: "#bae8e8",
  primary3: "#e3f6f5",
  primary4: "#ffd803",
  darkPurple: "#312F54",
};

// const colors = {
//   User: "#ffff77",
//   Repo: "#77ff77",
//   Org: "#ff7777",
//   Issue: "#77ffff",
// };

// const colors = {
//   User: "#000000",
//   Repo: "#ffffff",
//   Org: "#ffffff",
//   Issue: "#ffffff",
// };

const V = ({ children }) => {
  let type = children.split(":")[0];
  let id = children.split(":")[1];
  let icon = null;

  const color = colors.primary1;

  let backgroundColor = color;
  let styles = {
    fontFamily: `Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace`,
    fontSize: "0.9em",
    fontWeight: 600,
    padding: "2px 4px",
    borderRadius: "3px",
    background: backgroundColor,
    display: "inline",
    alignItems: "center",
    whiteSpace: "nowrap",
    border: `1px solid #ffffff44`,
  };

  if (type === "User") {
    // Gradient background for span
    const [fromColor, toColor] = {
      bob: [colors.primary2, tinycolor(colors.primary2).spin(20).toHexString()],
      alice: [colors.primary4, colors.primary4],
      carol: [colors.warning, colors.warning],
    }[id] || ["#ffffff", "#ffffff"];

    styles.background = `linear-gradient(90deg, ${fromColor} 0%, ${toColor} 100%)`;
    styles.color = "#000";
    styles.border = `1px solid transparent`;

    id = id[0].toUpperCase() + id.slice(1);
    icon = <HiUser style={{ verticalAlign: "text-top", marginRight: 2 }} />;
  }

  if (type === "Repo") {
    id = id[0].toUpperCase() + id.slice(1);
    icon = (
      <MdDescription style={{ verticalAlign: "text-top", marginRight: 2 }} />
    );
  }

  if (type === "Org") {
    id = id[0].toUpperCase() + id.slice(1);
    // styles.background = `linear-gradient(90deg, #ddddff 0%, #eeeeff 100%)`;
    // styles.color = "black";

    icon = (
      <MdCorporateFare style={{ verticalAlign: "text-top", marginRight: 2 }} />
    );
  }

  if (type === "Issue") {
    // id = id[0].toUpperCase() + id.slice(1);
    // styles.background = `linear-gradient(90deg, #ffdddd 0%, #fff 100%)`;
    // styles.color = "black";

    icon = (
      <HiOutlineChatAlt style={{ verticalAlign: "text-top", marginRight: 2 }} />
    );
    id = "too heavy!";
  }

  return (
    <>
      {/* {type === "Issue" ? "comment " : ""}
      {type === "Repo" ? "doc " : ""}
      {type === "Org" ? "org " : ""} */}
      <span style={styles}>
        {icon || (
          <span>
            {type}
            {type && id && ":"}
          </span>
        )}
        <span>{id}</span>
      </span>
    </>
  );
};

const inputFacts = {
  bobRole: ["has_role", "User:bob", "admin", "Org:acme"],
  aliceRole: ["has_role", "User:alice", "collaborator", "Repo:anvils"],
  anvilsParent: ["has_parent", "Repo:anvils", "Org:acme"],
  roadmapPublic: ["is_public", "Repo:roadmap"],
  issueParent: ["has_parent", "Issue:too_heavy", "Repo:anvils"],
  issueCreator: ["has_creator", "Issue:too_heavy", "User:alice"],
};

const outputs = {
  bobDeleteAnvils: ["User:bob", "can", "delete", "Repo:anvils"],
  carolReadRoadmap: ["User:carol", "can", "read", "Repo:roadmap"],
  aliceDeleteAnvils: ["User:alice", "cannot", "delete", "Repo:anvils"],
  aliceReadIssue: ["User:alice", "can", "read", "Issue:too_heavy"],
  bobCloseIssue: ["User:bob", "can", "close", "Issue:too_heavy"],
  bobReadRoadmap: ["User:bob", "can", "read", "Repo:roadmap"],
  aliceCloseIssue: ["User:alice", "can", "close", "Issue:too_heavy"],
  aliceReadRoadmap: ["User:alice", "can", "read", "Repo:roadmap"],
};

const dependencies = {
  bobDeleteAnvils: ["bobRole", "anvilsParent"],
  carolReadRoadmap: ["roadmapPublic"],
  aliceDeleteAnvils: ["aliceRole"],
  aliceReadIssue: ["aliceRole", "issueParent"],
  bobCloseIssue: ["bobRole", "issueParent", "anvilsParent"],
  bobReadRoadmap: ["roadmapPublic"],
  aliceCloseIssue: ["issueCreator"],
  aliceReadRoadmap: ["roadmapPublic"],
};

function source(fact) {
  if (fact[0] === "has_role") return "roles";
  if (fact[0] === "has_parent" && fact[1].startsWith("Repo:")) return "repos";
  if (fact[0] === "is_public") return "repos";
  if (fact[0] === "has_parent") return "issues";
  if (fact[0] === "is_locked") return "issues";
  if (fact[0] === "has_creator") return "issues";
}

const factsBySource = {};
for (const factName in inputFacts) {
  const factSource = source(inputFacts[factName]);
  if (!factsBySource[factSource]) factsBySource[factSource] = [];
  factsBySource[factSource].push(factName);
}

const FactList = ({ facts, selectedOutput, setSelectedOutput, refs }) => {
  const randomDependentOutput = (fact) => {
    let dependentOutputs = Object.entries(dependencies).filter(
      ([output, deps]) => deps.includes(fact)
    );
    // try to avoid picking the same output
    const filteredDependentOutputs = dependentOutputs.filter(
      ([output]) => output !== selectedOutput
    );
    if (filteredDependentOutputs.length)
      dependentOutputs = filteredDependentOutputs;
    const randomOutput =
      dependentOutputs[Math.floor(Math.random() * dependentOutputs.length)][0];
    setSelectedOutput(randomOutput);
  };
  const selectedDependencies = dependencies[selectedOutput] || [];
  return (
    <div>
      {facts.map((fact) => (
        <div
          key={fact}
          ref={refs[fact]}
          style={{
            opacity: selectedDependencies.includes(fact) ? 1 : 0.1,
            transition: "opacity 0.2s",
            textIndent: "-1em",
            paddingLeft: "1em",
            marginTop: 8,
            lineHeight: "1.5em",
            textShadow: selectedDependencies.includes(fact)
              ? "0 0 10px #ffffff99"
              : "none",
          }}
        >
          <span
            style={{ cursor: "pointer" }}
            onClick={() => randomDependentOutput(fact)}
          >
            <Fact fact={inputFacts[fact]} />
          </span>
        </div>
      ))}
    </div>
  );
};

export default function MarketingWidget() {
  const [selectedOutput, setSelectedOutput] = React.useState(null);
  const [isPaused, setIsPaused] = React.useState(false);
  const outputNames = Object.keys(outputs);
  const index = outputNames.indexOf(selectedOutput);
  const nextOutput = outputNames[(index + 1) % outputNames.length];

  useEffect(() => {
    if (!selectedOutput) {
      // initial state: only wait short time
      const timeout = setTimeout(() => setSelectedOutput(nextOutput), 500);
      return () => clearTimeout(timeout);
    }
    if (isPaused) {
      // resume in 5 seconds
      const timeout = setTimeout(() => setIsPaused(false), 5000);
      return () => clearTimeout(timeout);
    }
    // cycle through outputs every 5 seconds
    const timeout = setTimeout(() => {
      setSelectedOutput(nextOutput);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isPaused, selectedOutput, setSelectedOutput, nextOutput]);

  const overrideSelectedOutput = (output) => {
    setSelectedOutput(output);
    setIsPaused(true);
  };

  const roleFacts = factsBySource.roles;
  const repoFacts = factsBySource.repos;
  const issueFacts = factsBySource.issues;

  const factRefs = Object.keys(inputFacts).reduce((acc, factName) => {
    acc[factName] = React.useRef();
    return acc;
  }, {});
  const electricityToRef = React.useRef();
  const containerRef = React.useRef();

  const fromRefs = selectedOutput
    ? dependencies[selectedOutput].map((fact) => factRefs[fact])
    : [];

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <Electricity
        fromRefs={fromRefs}
        toRef={electricityToRef}
        containerRef={containerRef}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontFamily: "system-ui",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <FactList
            facts={roleFacts}
            selectedOutput={selectedOutput}
            setSelectedOutput={overrideSelectedOutput}
            refs={factRefs}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ flex: "1", padding: "10px 0", textAlign: "right" }}>
            <FactList
              facts={repoFacts}
              selectedOutput={selectedOutput}
              setSelectedOutput={overrideSelectedOutput}
              refs={factRefs}
            />
          </div>
          <div style={{ width: "7em" }} />
          <div style={{ flex: "1", padding: "10px 0" }}>
            <FactList
              facts={issueFacts}
              selectedOutput={selectedOutput}
              setSelectedOutput={overrideSelectedOutput}
              refs={factRefs}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <span
            ref={electricityToRef}
            style={{ cursor: "pointer" }}
            onClick={() => overrideSelectedOutput(nextOutput)}
          >
            <AnimatedOutputs
              outputs={outputs}
              selectedOutput={selectedOutput}
            />
          </span>
        </div>
      </div>
    </div>
  );
}

function subtractRect(a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    width: a.width,
    height: a.height,
  };
}

function scaleRect(a, multiple) {
  return {
    x: a.x * multiple,
    y: a.y * multiple,
    width: a.width * multiple,
    height: a.height * multiple,
  };
}

const ElectricityLine = ({ fromRef, toRef, containerRef }) => {
  const from = fromRef.current;
  const to = toRef.current;
  const container = containerRef.current;
  const canvas = React.useRef();
  const [fromRect, setFromRect] = React.useState(null);
  const [toRect, setToRect] = React.useState(null);

  const resetRects = useCallback(() => {
    if (!from || !to || !container) return;

    const fromRect = from.getBoundingClientRect();
    const toRect = to.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const fromRectInContainer = subtractRect(fromRect, containerRect);
    const toRectInContainer = subtractRect(toRect, containerRect);

    const scaledFromRect = scaleRect(fromRectInContainer, 2);
    const scaledToRect = scaleRect(toRectInContainer, 2);

    setFromRect(scaledFromRect);
    setToRect(scaledToRect);
  }, [from, to, container]);

  useEffect(() => {
    resetRects();
  }, [from, to, container]);

  useEffect(() => {
    if (!canvas.current || !fromRect || !toRect) return;

    const stop = drawElectricity(canvas.current, fromRect, toRect);

    return stop;
  }, [canvas, fromRect, toRect]);

  useEffect(() => {
    const resize = () => {
      resetRects();
    };

    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  });

  if (!from || !to || !container) return null;

  return (
    <canvas
      ref={canvas}
      width={container.clientWidth * 2}
      height={container.clientHeight * 2}
      style={{
        position: "absolute",
        pointerEvents: "none",
        top: 0,
        left: 0,
        width: container.clientWidth,
        height: container.clientHeight,
      }}
    />
  );
};

const Electricity = ({ fromRefs, toRef, containerRef }) => {
  return (
    <>
      {fromRefs.map((fromRef, i) => (
        <ElectricityLine
          key={i}
          fromRef={fromRef}
          toRef={toRef}
          containerRef={containerRef}
        />
      ))}
    </>
  );
};

const Arrow = () => {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 100,
        padding: "30px 20px 10px",
        width: 120,
        flexShrink: 1,
        alignSelf: "flex-end",
      }}
    >
      <img src={arrows} style={{ width: "100%" }} />
    </div>
  );
};

const AnimatedOutputs = ({ outputs, selectedOutput }) => {
  const transition = useListTransition([selectedOutput], 400);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: 60,
      }}
    >
      {transition((item, stage) => {
        const output = outputs[item];
        if (!output) return null;
        return (
          <div
            key={item}
            style={{
              position: "absolute",
              opacity: stage === "enter" ? 1 : 0,
              transform: `translateY(${
                stage === "from" ? 20 : stage === "leave" ? -20 : 0
              }px) scaleY(${stage !== "enter" ? 0.4 : 1})`,
              transition: "opacity 0.4s, transform 0.4s",
              whiteSpace: "nowrap",
              textShadow: stage === "enter" ? "0 0 10px #ffffff99" : "none",
            }}
          >
            <Output output={output} />
          </div>
        );
      })}
    </div>
  );
};

const Output = ({ output }) => {
  const allowed = output[1] === "can";
  const gradient = allowed
    ? `linear-gradient(90deg, ${tinycolor(colors.success).darken(
        10
      )} 0%, ${tinycolor(colors.success).darken(5)} 100%)`
    : `linear-gradient(90deg, ${tinycolor(colors.danger).lighten(
        3
      )} 0%, ${tinycolor(colors.danger).lighten(5)} 100%)`;
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <span
        style={{
          fontSize: "1em",
          // padding: "0.125rem 0.25rem",
          // borderRadius: 4,
          // background: gradient,
          marginBottom: "0.25rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "1.5em",
            padding: "0.125rem",
            borderRadius: 4,
            background: gradient,
          }}
        >
          {allowed ? (
            <HiCheck style={{ display: "block" }} />
          ) : (
            <HiX style={{ display: "block" }} />
          )}
        </span>
        {/* <span style={{ marginLeft: "0.25rem" }}>
          {allowed ? "Allowed" : "Denied"}
        </span> */}
      </span>
      <span style={{ display: "flex", alignItems: "center" }}>
        <span>
          <V>{output[0]}</V> {output[1]} <V>{output[2]}</V> <V>{output[3]}</V>
        </span>
      </span>
    </div>
  );
};

const Fact = ({ fact }) => {
  if (fact[0] === "has_role") {
    const article = fact[2] === "admin" ? "an" : "a";
    return (
      <>
        <V>{fact[1]}</V> is {article} <V>{fact[2]}</V> on <V>{fact[3]}</V>
      </>
    );
  }
  if (fact[0] === "has_parent") {
    return (
      <>
        <V>{fact[1]}</V> belongs to <V>{fact[2]}</V>
      </>
    );
  }
  if (fact[0] === "is_public") {
    return (
      <>
        <V>{fact[1]}</V> is public
      </>
    );
  }
  if (fact[0] === "is_locked") {
    return (
      <>
        <V>{fact[1]}</V> is locked
      </>
    );
  }
  if (fact[0] === "has_creator") {
    return (
      <>
        <V>{fact[1]}</V> was created by <V>{fact[2]}</V>
      </>
    );
  }
};
