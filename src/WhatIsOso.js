import React from "react";
import { useEffect, useMemo, useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/prism-light";
import ruby from "react-syntax-highlighter/dist/esm/languages/prism/ruby";
import dark from "react-syntax-highlighter/dist/cjs/styles/prism/shades-of-purple";
import { repos, policies, classes } from "./policies";

const goodPurples = {
  background: "rgb(45, 43, 85)",
};

SyntaxHighlighter.registerLanguage("ruby", ruby);

const LEARN_MORE_URL =
  window.LEARN_MORE_URL ||
  "https://docs.osohq.com/getting-started/quickstart.html";

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

function OrganizationName({ organization }) {
  return (
    <span style={{ color: "rgb(37, 99, 235)", fontWeight: 400 }}>
      {organization.name}
    </span>
  );
}

function RepoName({ repo }) {
  return (
    <span>
      <OrganizationName organization={repo.organization} />{" "}
      <span style={{ color: "rgb(156, 163, 175)" }}>/</span>{" "}
      <span style={{ color: "rgb(37, 99, 235)", fontWeight: 600 }}>
        {repo.name}
      </span>
    </span>
  );
}

function Repository({ repo, canDelete }) {
  return (
    <div className="repo">
      <style jsx>{`
        .repo {
          padding: 0.5rem 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .public {
          font-size: 0.75rem;
          line-height: 1rem;
          font-weight: 400;
          color: rgb(75, 85, 99);
          border: 1px solid rgb(209, 213, 219);
          border-radius: 0.25rem;
          padding: 0.125rem 0.25rem;
          margin-left: 0.25rem;
        }

        :global(.delete) {
          color: white;
          background-color: rgb(190, 24, 93);
        }

        :global(.delete:disabled) {
          color: white;
          background-color: rgb(209, 213, 219);
        }
      `}</style>
      <span>
        <RepoName repo={repo} />
        {repo.isPublic && <span className="public">Public</span>}
      </span>
      <Button small className="delete" disabled={!canDelete}>
        Delete
      </Button>
    </div>
  );
}

function Select(props) {
  return (
    <select
      style={{
        color: "black",
        border: "1px solid",
        borderColor: goodPurples.background,
        padding: 2,
        borderRadius: "4px",
        background: "white",
      }}
      {...props}
    />
  );
}

function Button({ small, ...props }) {
  return (
    <button
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
}

const allPermissions = Object.values(repos)
  .map((repo) => {
    return [
      ["read", repo],
      ["delete", repo],
    ];
  })
  .flat(1);

export default function WhatIsOso() {
  const [selectedPolicyName, setSelectedPolicyName] = useState("none");
  const policy = policies[selectedPolicyName];

  const policyNames = Object.keys(policies);
  const nextPolicyName =
    policyNames[policyNames.indexOf(selectedPolicyName) + 1];

  const [selectedUser, setSelectedUser] = useState(
    Object.keys(policy.users)[0]
  );

  const [Oso, setOso] = useState(null);

  useEffect(async () => {
    import("oso").then((m) => {
      setOso(() => m.Oso);
    });
  });

  const user =
    policy.users[selectedUser] || policy.users[Object.keys(policy.users)[0]];

  const oso = useMemo(() => {
    if (!Oso) return null;
    const oso = new Oso();
    oso.registerClass(classes.User);
    oso.registerClass(classes.Repository);
    oso.registerClass(classes.Organization);
    return oso;
  }, [Oso]);

  useEffect(() => {
    if (!oso) return;
    oso.clearRules();
    oso.loadStr(policy.polar);
    window.oso = oso;
    window.repos = repos;
    // window.users = users;
  }, [oso, policy]);

  const [repoPermissions, setRepoPermissions] = useState(allPermissions);
  useEffect(async () => {
    if (!oso) return;
    let repoPermissions = await Promise.all(
      Object.values(repos).map(async (repo) => {
        const canRead = await oso.isAllowed(user, "read", repo);
        const canDelete = await oso.isAllowed(user, "delete", repo);
        const permissions = [];
        if (canRead) permissions.push(["read", repo]);
        if (canDelete) permissions.push(["delete", repo]);
        return permissions;
      })
    );
    repoPermissions = repoPermissions.flat(1);
    setRepoPermissions(repoPermissions);
  }, [oso, policy, setRepoPermissions, user]);

  const readableRepos = repoPermissions
    .filter(([action, repo]) => action == "read")
    .map(([action, repo]) => repo);

  const deletableRepos = repoPermissions
    .filter(([action, repo]) => action == "delete")
    .map(([action, repo]) => repo);

  return (
    <div
      className="oso-web-demo"
      style={{
        minHeight: 500,
        maxHeight: 500,
      }}
    >
      <style jsx>{`
        .oso-web-demo {
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
          width: 66.66%;

          display: flex;
          flex-direction: column;
        }

        .policy-container :global(h1) {
          color: rgb(229, 231, 235);
        }

        .policy-selector {
          display: flex;
          align-items: center;
          margin-bottom: 1.25rem;
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

        .demo-app-container {
          padding: 1rem;
          display: flex;
          flex: 1;
          flex-direction: column;
          border-radius: 0 0.25rem 0.25rem 0;
        }

        .role-selector {
          display: flex;
          margin-bottom: 1rem;
          justify-content: end;
          align-items: center;
        }

        .demo-app {
          background: #fff;
          color: rgb(17, 24, 39);
          flex: 1;
          border-radius: 0.5rem;
          border: 1px solid rgb(209, 213, 219);
          margin-left: -4rem;
          box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px,
            rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;
        }

        .demo-app-url-bar {
          border-bottom: 1px solid rgb(229, 231, 235);
          border-radius: 0.5rem 0.5rem 0 0;
          padding: 0.5rem;
          background-color: rgb(243, 244, 246);
        }

        .demo-app-url-bar div {
          border-radius: 2rem;
          background: white;
          padding: 0.25rem 1rem;
        }

        .demo-app-inner {
          padding: 1rem;
          position: relative;
        }

        .sample-app-badge {
          position: absolute;
          top: 0;
          right: 0;
          margin: 1rem;
          font-size: 0.75rem;
          line-height: 1rem;
          color: rgb(107, 114, 128);
          padding: 0.25rem 0.5rem;
          border: 1px solid rgb(229, 231, 235);
          border-radius: 0.25rem;
        }

        .no-repos {
          display: flex;
          justify-content: center;
          color: #888;
        }
      `}</style>
      <div
        className="policy-container"
        style={{ background: goodPurples.background }}
      >
        <div className="policy-selector">
          <Heading>Policy:</Heading>
          <div className="ml-3">
            <Select
              value={selectedPolicyName}
              onChange={(e) => setSelectedPolicyName(e.target.value)}
            >
              {Object.entries(policies).map(([name, repo]) => (
                <option value={name} key={name}>
                  {repo.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="ml-3">
            {nextPolicyName ? (
              <Button
                className="next"
                onClick={() => setSelectedPolicyName(nextPolicyName)}
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
              backgroundColor: goodPurples.background,
            }}
            language="ruby"
            wrapLongLines={true}
            style={dark}
          >
            {policy.polar}
          </SyntaxHighlighter>
          <div className="shadow" />
        </div>
      </div>
      <div className="demo-app-container">
        <div
          className="role-selector"
          style={{
            visibility:
              Object.keys(policy.users).length > 1 ? "visible" : "hidden",
          }}
        >
          <Heading>View as:</Heading>
          <div className="ml-3">
            <Select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {Object.keys(policy.users).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="demo-app">
          <div className="demo-app-url-bar">
            <div>gitclub.com</div>
          </div>
          <div className="demo-app-inner">
            <div className="sample-app-badge">Sample app</div>
            {user.roles.length > 0 && (
              <div>
                <Heading>Roles</Heading>
                <div className="pb-4" />
                <div className="">
                  {user.roles.map(({ name, resource }) => (
                    <div key={`${name}${JSON.stringify(resource)}`}>
                      <span style={{ fontWeight: 600 }}>{name}</span>{" "}
                      <span style={{ fontSize: "0.875rem" }}>on</span>{" "}
                      {resource instanceof classes.Organization ? (
                        <OrganizationName organization={resource} />
                      ) : (
                        <RepoName repo={resource} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="pb-4" />
              </div>
            )}
            <Heading>Repos</Heading>
            <div className="pb-2" />
            <div className="with-dividers">
              {readableRepos.map((repo) => (
                <Repository
                  repo={repo}
                  key={repo.name}
                  canDelete={deletableRepos.includes(repo)}
                />
              ))}
            </div>
            {!readableRepos.length && (
              <div className="no-repos">No repos :(</div>
            )}
            <div className="pb-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
