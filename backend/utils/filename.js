export function createFileAlias({filename, fileId}) {
    const safename = basename(filename);

    return `${randomUUID}_${safename}_${Date.now()}.gz`;
}
