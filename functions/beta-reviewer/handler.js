"use strict"

const axios = require('axios');

const MINIMUM_SUBJECTS = 100;
const REQUIRED_PAGES = ['science_case', 'faq'];

const instance = axios.create({
  baseURL: 'https://www.zooniverse.org/api',
  headers: {
    'Accept': 'application/vnd.api+json; version=1',
    'Content-Type': 'application/json',
  }
});

module.exports = (context, callback) => {
  const projectId = context;
  const responseObject = {};

  function getProject(projectId) {
    return instance.get(`/projects/${projectId}?include=pages`);
  }

  getProject(projectId)
    .then(projectResponse => {
      const project = projectResponse.data.projects[0];
      const pages = projectResponse.data.linked.project_pages;

      responseObject.projectHasActiveWorkflows = {
        pass: project.links.active_workflows && project.links.active_workflows.length > 0,
      };

      responseObject.projectIsPublic = {
        pass: !project.private,
      };

      responseObject.projectIsLive = {
        pass: project.live,
      };
      responseObject.subjectsCount = {
        pass: project.subjects_count >= MINIMUM_SUBJECTS,
      };

      const missingPages = REQUIRED_PAGES.reduce((accumulator, requiredPage) => {
        const pageExists = pages.find(page => page.url_key === requiredPage);

        if (!pageExists || (pageExists.content === null || pageExists.content === '')) {
          accumulator.push(requiredPage);
        }

        return accumulator;
      }, []);

      responseObject.pages = {
        pass: missingPages.length === 0,
      }

      if (!responseObject.pages.pass) {
        responseObject.pages.payload = missingPages;
      }

      callback(null, responseObject);
    })
}
