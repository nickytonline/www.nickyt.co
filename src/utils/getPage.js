import _ from 'lodash';

export default function(pages, pagePath) {
    // TODO: resolve relative paths relative to current page
    pagePath = pagePath.replace(/^\//, '');
    return _.find(pages, {relativePath: pagePath});
}
