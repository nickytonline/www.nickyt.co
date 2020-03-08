import _ from 'lodash';

export default function(pages, pagePath) {
    if (_.startsWith(pagePath, '#')) {
        return pagePath;
    } else {
        pagePath = pagePath.replace(/^\//, '');
        const page = _.find(pages, {relativePath: pagePath});
        if (!page) {
            throw new Error('could not find page with path: ' + pagePath);
        }
        return page.url;
    }
}
