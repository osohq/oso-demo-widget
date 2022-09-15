import React, { useEffect } from "react";
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

// const colors = {
//   User: "#ffff77",
//   Repo: "#77ff77",
//   Org: "#ff7777",
//   Issue: "#77ffff",
// };

const colors = {
  User: "#000000",
  Repo: "#ffffff",
  Org: "#ffffff",
  Issue: "#ffffff",
};

const V = ({ children }) => {
  let type = children.split(":")[0];
  let id = children.split(":")[1];
  let icon = null;

  const color = colors[type] || "#ffffff";

  let backgroundColor = color + "33";
  let borderColor = color + "44";
  let styles = {
    fontFamily: `Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace`,
    fontSize: "0.9em",
    fontWeight: 600,
    padding: "2px 4px",
    borderRadius: "3px",
    background: backgroundColor,
    display: "inline",
    alignItems: "center",
    borderColor,
    whiteSpace: "nowrap",
  };

  if (type === "User") {
    // Gradient background for span
    const [fromColor, toColor] = {
      bob: ["#d000ff", "#ff00ff"],
      alice: ["#ff3a00", "#ff5a00"],
      carol: ["#ff0000", "#ff0077"],
    }[id] || ["#ffffff", "#ffffff"];

    styles.background = `linear-gradient(90deg, ${fromColor} 0%, ${toColor} 100%)`;
    // styles.color = "black";

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

const FactList = ({ facts, selectedOutput, setSelectedOutput }) => {
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
          style={{
            opacity: selectedDependencies.includes(fact) ? 1 : 0.2,
            transition: "opacity 0.2s",
            textIndent: "-1em",
            paddingLeft: "1em",
            paddingTop: 8,
            lineHeight: "1.5em",
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

  return (
    <div>
      <div
        style={{ display: "flex", flexDirection: "column", fontSize: "11pt" }}
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
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ flex: "1", padding: "10px 0", textAlign: "right" }}>
            <FactList
              facts={repoFacts}
              selectedOutput={selectedOutput}
              setSelectedOutput={overrideSelectedOutput}
            />
          </div>
          <Arrow />
          <div style={{ flex: "1", padding: "10px 0" }}>
            <FactList
              facts={issueFacts}
              selectedOutput={selectedOutput}
              setSelectedOutput={overrideSelectedOutput}
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

const Arrow = () => {
  return (
    <div
      style={{
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
        height: 40,
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
                stage === "from" ? 10 : stage === "leave" ? -10 : 0
              }px) scaleY(${stage !== "enter" ? 0.4 : 1})`,
              transition: "opacity 0.4s, transform 0.4s",
              whiteSpace: "nowrap",
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
  return (
    <span style={{ display: "flex", alignItems: "center" }}>
      <span
        style={{ fontSize: "1.5em", color: allowed ? "#13EF6B" : "#ED183E" }}
      >
        {allowed ? <HiCheck /> : <HiX />}
      </span>
      <span>
        <V>{output[0]}</V> {output[1]} <V>{output[2]}</V> <V>{output[3]}</V>
      </span>
    </span>
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
