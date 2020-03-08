import _ from "lodash";

export default function(pages, folderPath) {
    // TODO: resolve relative paths relative to current page
    folderPath = folderPath.replace(/^\//, '');
    return _.filter(pages, {relativeDir: folderPath});
}
