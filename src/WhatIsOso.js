import { useEffect, useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark as dark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Oso } from "oso";

// let Oso;
// import("oso")
//   .catch((e) => console.error("Error importing `oso`:", e))
//   // .then((m) => m())
//   .then((m) => {
//     console.log(m);
//     Oso = m.Oso;
//     console.log(Oso);
//   });

const Heading = (props) => <h1 className="text-xl font-bold" {...props}></h1>;

function Repository({ repo, canDelete }) {
  return (
    <div className="py-2 font-semibold flex justify-between items-center">
      <span>
        <span className="text-gray-500">{repo.organization.name} /</span>{" "}
        {repo.name}
      </span>
      {canDelete ? (
        <button
          className="bg-pink-700 py-1 px-2 rounded text-sm text-white pointer-events-none"
          disabled={!canDelete}
        >
          Delete
        </button>
      ) : (
        <button className="bg-gray-300 py-1 px-2 rounded text-sm text-white pointer-events-none">
          Delete
        </button>
      )}
    </div>
  );
}

function Issue({ repo, title }) {
  return (
    <div className="py-2 flex justify-between items-center">
      <div>
        {title}
        <div className="text-xs mt-1">
          on{" "}
          <span className="font-semibold">
            <span className="text-gray-500">{repo.org} /</span> {repo.name}
          </span>
        </div>
      </div>
      <div>
        <button className="bg-green-700 py-1 px-2 rounded text-sm text-white pointer-events-none">
          Close
        </button>
      </div>
    </div>
  );
}

const classes = {
  User: class {
    static name = "User";
    constructor(roles = []) {
      this.roles = roles.map(([name, resource]) => ({
        name,
        resource,
      }));
    }
  },
  Repository: class {
    static name = "Repository";
    constructor(organization, name) {
      this.name = name;
      this.organization = organization;
    }
  },
  Organization: class {
    static name = "Organization";
    constructor(name) {
      this.name = name;
    }
  },
};

const orgs = {
  google: new classes.Organization("google"),
  facebook: new classes.Organization("facebook"),
};

const repos = {
  gmail: new classes.Repository(orgs.google, "gmail"),
  search: new classes.Repository(orgs.google, "search"),
  messenger: new classes.Repository(orgs.facebook, "messenger"),
  instagram: new classes.Repository(orgs.facebook, "instagram"),
};

const users = {
  user1: new classes.User([
    ["member", orgs.google],
    ["admin", repos.search],
  ]),
  user2: new classes.User([
    ["owner", orgs.facebook],
    ["contributor", repos.search],
  ]),
};

const nonePolicy = {
  polar: `
# Allow any user to perform any action on any
# resource
allow(_, _, _);
`.trim(),
  users: {
    "-": new classes.User(),
  },
};

const emptyPolicy = {
  polar: `
# Oso is deny-by-default, so an empty policy
# means nobody can do anything.
`.trim(),
  users: {
    "-": new classes.User(),
  },
};

const readOnlyPolicy = {
  polar: `
# Allow any user to perform the "read" action
# on any resource. Note that deleting
# repositories is no longer allowed.
allow(_, "read", _);
`.trim(),
  users: {
    "-": new classes.User(),
  },
};

const rbacPolicy = {
  polar: `
resource Organization {
  roles = ["member", "owner"];

  # Being an owner implies being a member
  "member" if "owner";
}

has_role(actor, role_name, resource) if
  role in actor.roles and
  role matches { name: role_name, resource: resource };

allow(actor, "read", repository) if
  has_role(actor, "member", repository.organization);

allow(actor, "delete", repository) if
  has_role(actor, "owner", repository.organization);
`.trim(),
  users: {
    "Member of google": new classes.User([["member", orgs.google]]),
    "Owner of facebook": new classes.User([["owner", orgs.facebook]]),
  },
};

const advancedPolicy = {
  polar: `
resource Repository {
  permissions = ["read", "delete"];
  roles = ["contributor", "admin"];
  relations = {parent: Organization};

  "delete" if "admin";
  "read" if "contributor";

  "contributor" if "admin";
  "contributor" if "member" on "parent";
  "admin" if "owner" on "parent";
}

resource Organization {
  roles = ["member", "owner"];
  "member" if "owner";
}

has_relation(organization, "parent", repository) if
  repository.organization = organization;

has_role(actor, role_name, resource) if
  role in actor.roles and
  role matches { name: role_name, resource: resource };

allow(actor, action, resource) if
  has_permission(actor, action, resource);
`.trim(),
  users: {
    "Member of google": new classes.User([["member", orgs.google]]),
    "Owner of facebook": new classes.User([["owner", orgs.facebook]]),
    "Contributor to search": new classes.User([["contributor", repos.search]]),
    "Admin of messenger": new classes.User([["admin", repos.messenger]]),
  },
};

const policies = {
  none: nonePolicy,
  empty: emptyPolicy,
  read: readOnlyPolicy,
  rbac: rbacPolicy,
  advanced: advancedPolicy,
};

export default function WhatIsOso() {
  const [selectedPolicyName, setSelectedPolicyName] = useState("none");
  const policy = policies[selectedPolicyName];

  const [selectedUser, setSelectedUser] = useState(
    Object.keys(policy.users)[0]
  );

  const user =
    policy.users[selectedUser] || policy.users[Object.keys(policy.users)[0]];

  const oso = useMemo(() => {
    const oso = new Oso();
    oso.registerClass(classes.User);
    oso.registerClass(classes.Repository);
    oso.registerClass(classes.Organization);
    return oso;
  }, []);

  useEffect(() => {
    oso.clearRules();
    oso.loadStr(policy.polar);
    window.oso = oso;
    window.users = users;
    window.repos = repos;
    // window.users = users;
  }, [oso, policy]);

  const [repoPermissions, setRepoPermissions] = useState([]);
  useEffect(async () => {
    let repoPermissions = await Promise.all(
      Object.values(repos).map(async (repo) => {
        const canRead = await oso.isAllowed(user, "read", repo);
        console.log(canRead);
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

  console.log(repoPermissions);
  const readableRepos = repoPermissions
    .filter(([action, repo]) => action == "read")
    .map(([action, repo]) => repo);

  const deletableRepos = repoPermissions
    .filter(([action, repo]) => action == "delete")
    .map(([action, repo]) => repo);

  return (
    <div className="grid grid-cols-3 max-w-6xl" style={{ minHeight: 400 }}>
      <div
        className="text-gray-200 rounded-lg p-4 pr-20 col-span-2"
        style={{ background: "rgb(43, 43, 43)" }}
      >
        <div className="flex mb-5">
          <Heading>Policy:</Heading>
          <div className="ml-3">
            <select
              className="text-black border-solid border-1 p-1 rounded"
              value={selectedPolicyName}
              onChange={(e) => setSelectedPolicyName(e.target.value)}
            >
              <option value="none">None</option>
              <option value="empty">Empty</option>
              <option value="read">Read-only</option>
              <option value="rbac">Basic RBAC</option>
              <option value="advanced">Advanced RBAC</option>
            </select>
          </div>
        </div>
        <SyntaxHighlighter
          customStyle={{
            padding: 0,
            margin: 0,
          }}
          language="ruby"
          wrapLongLines={true}
          style={dark}
        >
          {policy.polar}
        </SyntaxHighlighter>
      </div>
      <div className="p-4 flex flex-col rounded-r">
        <div
          className="flex mb-4 justify-end"
          style={{
            visibility:
              Object.keys(policy.users).length > 1 ? "visible" : "hidden",
          }}
        >
          <Heading>View app as:</Heading>
          <div className="ml-3">
            <select
              className="text-black border border-gray-400 py-1 rounded"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {Object.keys(policy.users).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-white flex-1 rounded-md border border-gray-300 -ml-16 shadow-lg">
          <div className="border-b bg-gray-100 border-gray-200 p-2 rounded-t-md">
            <div className="rounded-full bg-white p-1 px-4">gitclub.com</div>
          </div>
          <div className="p-4">
            <Heading>Repos</Heading>
            <div className="mb-2" />
            <div className="divide-y divide-light-gray-400">
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
            <div className="mb-4" />

            {/* <Heading>Issues</Heading>
            <div className="mb-2" />
            <div className="divide-y divide-light-gray-400">
              <Issue
                title="Something is broken :("
                repo={{ org: "google", name: "gmail" }}
              />
              <Issue
                title="Something is broken :("
                repo={{ org: "google", name: "search" }}
              />
              <Issue
                title="Something is broken :("
                repo={{ org: "facebook", name: "messenger" }}
              />
              <Issue
                title="Something is broken :("
                repo={{ org: "facebook", name: "news-feed" }}
              />
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
