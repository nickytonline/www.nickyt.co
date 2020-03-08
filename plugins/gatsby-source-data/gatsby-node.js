const path = require('path');
const yaml = require('js-yaml');
const fse = require('fs-extra');
const _ = require('lodash');


async function readDirRecursively(dir) {
    const files = await fse.readdir(dir);
    const promises = _.map(files, async file => {
        const filePath = path.join(dir, file);
        const stats = await fse.stat(filePath);
        if (stats.isDirectory()) {
            return readDirRecursively(filePath);
        } else if (stats.isFile()) {
            return filePath;
        } else {
            return null;
        }
    });
    const recFiles = await Promise.all(promises);
    return _.chain(recFiles).compact().flatten().value();
}

const parsers = {
    yaml: (data) => yaml.safeLoad(data, {schema: yaml.JSON_SCHEMA}),
    json: (data) => JSON.parse(data)
};

const supportedExtensions = {
    'yaml': parsers.yaml,
    'yml': parsers.yaml,
    'json': parsers.json
};

function convertDataFilesToJSON(dataFiles, relativePath) {
    let promises = _.map(dataFiles, filePath => {
        const pathObject = path.parse(filePath);
        const relDir = path.relative(relativePath, pathObject.dir);
        const ext = pathObject.ext.substring(1);
        if (!_.has(supportedExtensions, ext)) {
            return null;
        }
        return fse.readFile(filePath).then(data => {
            const propPath = _.compact(relDir.split(path.sep).concat(pathObject.name));
            const parsedData = supportedExtensions[ext](data);
            const res = {};
            _.set(res, propPath, parsedData);
            return res;
        });
    });
    return Promise.all(promises).then(results => {
        return _.reduce(results, (data, res) => _.merge(data, res), {})
    });
}

exports.sourceNodes = (props, pluginOptions = {}) => {
    const createContentDigest = props.createContentDigest;
    const actions = props.actions;

    if (!_.get(pluginOptions, 'path')) {
        pluginOptions.path = 'src/data';
    }

    if (!path.isAbsolute(pluginOptions.path)) {
        pluginOptions.path = path.resolve(process.cwd(), pluginOptions.path)
    }

    if (!fse.existsSync(pluginOptions.path)) {
        return;
    }

    return readDirRecursively(pluginOptions.path).then(dataFiles => {
        const sortedDataFiles = dataFiles.slice().sort();
        return convertDataFilesToJSON(sortedDataFiles, pluginOptions.path);
    }).then(data => {
        actions.createNode({
            id: 'SiteData',
            parent: null,
            children: [],
            data: data,
            internal: {
                type: 'SiteData',
                contentDigest: createContentDigest(JSON.stringify(data)),
                description: `Site data from ${path.relative(process.cwd(), pluginOptions.path)}`
            }
        });
    });
};
