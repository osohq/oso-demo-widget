import { useEffect, useMemo, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark as dark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Oso } from "oso";

const LEARN_MORE_URL = "https://docs.osohq.com";

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
    constructor(organization, name, isPublic = false) {
      this.name = name;
      this.organization = organization;
      this.isPublic = isPublic;
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
  react: new classes.Repository(orgs.facebook, "react", true),
};

const users = {
  user1: new classes.User([
    ["member", orgs.google],
    ["admin", repos.search],
  ]),
  user2: new classes.User([
    ["owner", orgs.facebook],
    ["reader", repos.search],
  ]),
};

const nonePolicy = {
  name: "Allow anything",
  polar: `
# This rule matches all inputs, allowing
# any actor to perform any action on any
# resource. Not very useful...
allow(_actor, _action, _resource);
`.trim(),
  users: {
    "-": new classes.User(),
  },
};

const emptyPolicy = {
  name: "Empty",
  polar: `
# Oso is deny-by-default, so an empty policy
# means nobody can do anything. This system is
# locked down.
`.trim(),
  users: {
    "-": new classes.User(),
  },
};

const readOnlyPolicy = {
  name: "Only public repos",
  polar: `
# Allow any user to perform the "read" action
# on a repository if it is public. Note that
# the delete button is disabled, because no
# one has permission to delete it.
allow(_actor, "read", repository: Repository) if
  repository.isPublic;
`.trim(),
  users: {
    "-": new classes.User(),
  },
};

const rbacPolicy = {
  name: "Basic RBAC",
  polar: `
# Now roles are involved -- users have roles
# on repositories, granting them permissions
# specific to each repository.
resource Repository {
  permissions = ["read", "delete"];
  roles = ["reader", "admin"];

  "delete" if "admin";
  "read" if "reader";

  "reader" if "admin";
}

has_role(actor, role_name, resource) if
  role in actor.roles and
  role.name = role_name and
  role.resource = resource;

allow(_actor, "read", repository: Repository) if
  repository.isPublic;

allow(actor, action, resource) if
  has_permission(actor, action, resource);
`.trim(),
  users: {
    "Admin of gmail": new classes.User([["admin", repos.gmail]]),
    "Reader of instagram": new classes.User([["reader", repos.instagram]]),
  },
};

const advancedPolicy = {
  name: "Advanced RBAC",
  polar: `
# Now roles are involved -- users have roles
# on organizations.
resource Repository {
  permissions = ["read", "delete"];
  roles = ["reader", "admin"];
  relations = {parent: Organization};

  "delete" if "admin";
  "read" if "reader";

  "reader" if "admin";
  "reader" if "member" on "parent";
  "admin" if "owner" on "parent";
}

resource Organization {
  roles = ["member", "owner"];
  "member" if "owner";
}

has_role(actor, role_name, resource) if
  role in actor.roles and
  role matches { name: role_name, resource: resource };

has_relation(organization: Organization,
             "parent", repository: Repository) if
  repository.organization = organization;

allow(_actor, "read", repository: Repository) if
  repository.isPublic;

allow(actor, action, resource) if
  has_permission(actor, action, resource);
`.trim(),
  users: {
    "Member of google": new classes.User([["member", orgs.google]]),
    "Owner of facebook": new classes.User([["owner", orgs.facebook]]),
    "Reader of search": new classes.User([["reader", repos.search]]),
    "Multiple roles": new classes.User([
      ["admin", repos.messenger],
      ["reader", repos.gmail],
    ]),
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

  const policyNames = Object.keys(policies);
  const nextPolicyName =
    policyNames[policyNames.indexOf(selectedPolicyName) + 1];

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
    <div
      className="flex items-stretch"
      style={{
        minHeight: 500,
        maxHeight: 500,
      }}
    >
      <div
        className="text-gray-200 rounded-lg p-4 sm:pr-20 col-span-2 w-full sm:w-2/3 flex flex-col"
        style={{ background: "rgb(43, 43, 43)" }}
      >
        <div className="flex mb-5 items-center">
          <Heading>Policy:</Heading>
          <div className="ml-3">
            <select
              className="text-black border-solid border-1 p-1 rounded bg-white"
              value={selectedPolicyName}
              onChange={(e) => setSelectedPolicyName(e.target.value)}
            >
              {Object.entries(policies).map(([name, repo]) => (
                <option value={name} key={name}>
                  {repo.name}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-3">
            {nextPolicyName ? (
              <button
                className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-0.5 rounded"
                onClick={() => setSelectedPolicyName(nextPolicyName)}
              >
                Next
              </button>
            ) : (
              <a href={LEARN_MORE_URL}>
                <button className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-0.5 rounded">
                  Learn more &rarr;
                </button>
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
            }}
            className="overflow-auto text-xs sm:text-base h-full"
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
              background:
                "linear-gradient(rgba(43, 43, 43, 0), rgb(43, 43, 43))",
            }}
          ></div>
        </div>
      </div>
      <div className="p-4 flex-col rounded-r flex-grow hidden sm:flex">
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
              className="text-black border border-gray-400 p-1 rounded bg-white"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              {Object.keys(policy.users).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-white flex-1 rounded-md border border-gray-300 -ml-16 shadow-lg pointer-events-none">
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
                <div className="mb-2" />
                <div className="">
                  {user.roles.map(({ name, resource }) => (
                    <div>
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
            <div className="mb-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
