export const classes = {
  User: class {
    constructor(roles = []) {
      this.roles = roles.map(([name, resource]) => ({
        name,
        resource,
      }));
    }
  },
  Repository: class {
    constructor(organization, name, isPublic = false) {
      this.name = name;
      this.organization = organization;
      this.isPublic = isPublic;
    }
  },
  Organization: class {
    constructor(name) {
      this.name = name;
    }
  },
};

const orgs = {
  google: new classes.Organization("google"),
  facebook: new classes.Organization("facebook"),
};

export const repos = {
  gmail: new classes.Repository(orgs.google, "gmail"),
  search: new classes.Repository(orgs.google, "search"),
  messenger: new classes.Repository(orgs.facebook, "messenger"),
  instagram: new classes.Repository(orgs.facebook, "instagram"),
  react: new classes.Repository(orgs.facebook, "react", true),
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
actor User {}

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

has_role(actor: User, role_name: String, resource: Repository) if
  role in actor.roles and
  role.name = role_name and
  role.resource = resource;

has_permission(_actor: User, "read", repository: Repository) if
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
actor User {}

resource Repository {
  permissions = ["read", "delete"];
  roles = ["reader", "admin"];
  relations = { parent: Organization };

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

has_role(actor: User, role_name: String, resource: Resource) if
  role in actor.roles and
  role.name = role_name and
  role.resource = resource;

has_relation(organization: Organization,
             "parent", repository: Repository) if
  repository.organization = organization;

has_permission(_actor: User, "read", repository: Repository) if
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

export const policies = {
  none: nonePolicy,
  empty: emptyPolicy,
  read: readOnlyPolicy,
  rbac: rbacPolicy,
  advanced: advancedPolicy,
};
