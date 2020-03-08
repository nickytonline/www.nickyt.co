import classNames from 'classnames';

// A simple wrapper around classNames to return null, if no classes were generated
// Otherwise, original classNames returns empty string which causes class="" to be generated
export default function(...args) {
    return classNames.call(this, ...args) || null;
}
