export default function() {
    const args = Array.prototype.slice.call(arguments);
    let index = 0;
    return {
        next: () => args[index++ % args.length]
    };
};
