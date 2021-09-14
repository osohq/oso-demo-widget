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
  <h1 className="sm:text-xl font-bold" {...props}></h1>
);

function OrganizationName({ organization }) {
  return <span className="text-blue-600 font-normal">{organization.name}</span>;
}

function RepoName({ repo }) {
  return (
    <span>
      <OrganizationName organization={repo.organization} />{" "}
      <span className="text-gray-400">/</span>{" "}
      <span className="text-blue-600 font-semibold">{repo.name}</span>
    </span>
  );
}

function Repository({ repo, canDelete }) {
  return (
    <div className="py-2 flex justify-between items-center">
      <span>
        <RepoName repo={repo} />
        {repo.isPublic && (
          <span className="text-xs font-normal text-gray-600 border border-gray-300 rounded ml-1 px-1 py-0.5">
            Public
          </span>
        )}
      </span>
      {canDelete ? (
        <Button
          small
          className="bg-pink-700 py-1 px-2 rounded text-sm text-white pointer-events-none"
          disabled={!canDelete}
        >
          Delete
        </Button>
      ) : (
        <Button
          small
          className="bg-gray-300 py-1 px-2 rounded text-sm text-white pointer-events-none"
        >
          Delete
        </Button>
      )}
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
      className="oso-web-demo flex items-stretch antialiased"
      style={{
        minHeight: 500,
        maxHeight: 500,
      }}
    >
      <div
        className="text-gray-200 rounded-lg p-6 sm:pr-20 col-span-2 w-full sm:w-2/3 flex flex-col"
        style={{ background: goodPurples.background }}
      >
        <div className="flex mb-5 items-center">
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
                className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-0.5 rounded"
                onClick={() => setSelectedPolicyName(nextPolicyName)}
              >
                Next
              </Button>
            ) : (
              <a href={LEARN_MORE_URL}>
                <Button className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-0.5 rounded">
                  Try it &rarr;
                </Button>
              </a>
            )}
          </div>
        </div>
        <div className="relative overflow-hidden">
          <SyntaxHighlighter
            customStyle={{
              padding: "0 0 60px",
              margin: 0,
              overflow: "auto",
              backgroundColor: goodPurples.background,
            }}
            className="overflow-auto text-xs sm:text-base h-full font-mono"
            language="ruby"
            wrapLongLines={true}
            style={dark}
          >
            {policy.polar}
          </SyntaxHighlighter>
          <div
            className="absolute inset-x-0 bottom-0"
            style={{
              height: 60,
              background: "linear-gradient(#2D2B5500, #2D2B55)",
            }}
          ></div>
        </div>
      </div>
      <div className="p-4 flex-col rounded-r flex-grow hidden sm:flex">
        <div
          className="flex mb-4 justify-end items-center"
          style={{
            visibility:
              Object.keys(policy.users).length > 1 ? "visible" : "hidden",
          }}
        >
          <Heading>View app as:</Heading>
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
        <div className="bg-white text-gray-900 flex-1 rounded-md border border-gray-300 -ml-16 shadow-lg pointer-events-none">
          <div className="border-b bg-gray-100 border-gray-200 p-2 rounded-t-md">
            <div className="rounded-full bg-white p-1 px-4">gitclub.com</div>
          </div>
          <div className="p-4 relative">
            <div className="absolute top-0 right-0 m-4">
              <div className="border border-gray-200 text-gray-500 px-2 p-1 text-xs rounded">
                Sample app
              </div>
            </div>
            {user.roles.length > 0 && (
              <div>
                <Heading>Roles</Heading>
                <div className="mb-4" />
                <div className="">
                  {user.roles.map(({ name, resource }) => (
                    <div key={`${name}${JSON.stringify(resource)}`}>
                      <span className="font-semibold">{name}</span>{" "}
                      <span className="text-sm">on</span>{" "}
                      {resource instanceof classes.Organization ? (
                        <OrganizationName organization={resource} />
                      ) : (
                        <RepoName repo={resource} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mb-4" />
              </div>
            )}
            <Heading>Repos</Heading>
            <div className="mb-2" />
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
              <div className="flex justify-center text-gray-500">
                No repos :(
              </div>
            )}
            <div className="mb-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
