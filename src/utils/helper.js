// @ts-check

/** @typedef {Object} Organization @property {string} _id @property {string} orgName @property {string} [description] @property {Object} [adviserId] @property {string} [adviserId.username] @property {Date} createdAt @property {Date} updatedAt */

/** @param {Organization} org */
const mapOrganization = (org) => ({
  _id: org._id,
  orgName: org.orgName,
  description: org.description,
  adviser: org.adviserId?.username ?? null,
  createdAt: org.createdAt,
  updatedAt: org.updatedAt,
});

export { mapOrganization };
