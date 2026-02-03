import JSZip from 'jszip';

const SIGNATURE = "STAN_STUDIO_PROJECT_SECURED_V1";
const XOR_KEY = [0x53, 0x54, 0x41, 0x4E, 0x47, 0x52, 0x41, 0x56, 0x49, 0x54, 0x59]; // STANGRAVITY

const processBinary = (uint8) => {
    for (let i = 0; i < uint8.length; i++) {
        uint8[i] ^= XOR_KEY[i % XOR_KEY.length];
    }
    return uint8;
};

export const exportToStan = async (folderHandle, fileTree) => {
    const ZipConstructor = JSZip.default || JSZip;
    const zip = new ZipConstructor();

    const addToZip = async (items, currentPath = "") => {
        for (const item of items) {
            const path = currentPath ? `${currentPath}/${item.name}` : item.name;
            if (item.kind === 'directory' && item.children) {
                await addToZip(item.children, path);
            } else if (item.kind === 'file') {
                if (item.handle && typeof item.handle.getFile === 'function') {
                    const file = await item.handle.getFile();
                    zip.file(path, file);
                } else if (item.content !== undefined) {
                    zip.file(path, item.content);
                }
            }
        }
    };

    await addToZip(fileTree);
    const zipContent = await zip.generateAsync({ type: "uint8array" });

    // Obfuscate the zip content so standard tools fail
    const obfuscatedZip = processBinary(zipContent);

    // Prepend signature
    const signatureBytes = new TextEncoder().encode(SIGNATURE);
    const finalData = new Uint8Array(signatureBytes.length + obfuscatedZip.length);
    finalData.set(signatureBytes);
    finalData.set(obfuscatedZip, signatureBytes.length);

    return new Blob([finalData], { type: "application/stan" });
};

export const importFromStan = async (fileBlob) => {
    const arrayBuffer = await fileBlob.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const signatureBytes = new TextEncoder().encode(SIGNATURE);

    // Verify proprietary signature
    const header = data.slice(0, signatureBytes.length);
    const headerText = new TextDecoder().decode(header);

    if (headerText !== SIGNATURE) {
        throw new Error("UNAUTHORIZED_ACCESS: This file format is exclusive to Stan Studio. Access denied.");
    }

    const obfuscatedZip = data.slice(signatureBytes.length);

    // Re-process to reveal original zip
    const originalZipContent = processBinary(obfuscatedZip);

    let zip;
    try {
        const ZipConstructor = JSZip.default || JSZip;
        zip = await ZipConstructor.loadAsync(originalZipContent);
    } catch {
        throw new Error("CORRUPTION_ERROR: The .stan file is corrupted or not recognized.");
    }

    const tree = [];
    const files = [];
    zip.forEach((relativePath, file) => {
        files.push({ path: relativePath, file });
    });

    for (const entry of files) {
        if (!entry.file.dir) {
            const pathParts = entry.path.split('/');
            const content = await entry.file.async("string");

            let currentLevel = tree;
            for (let i = 0; i < pathParts.length; i++) {
                const part = pathParts[i];
                const isFile = i === pathParts.length - 1;

                let existing = currentLevel.find(item => item.name === part);
                if (!existing) {
                    existing = {
                        name: part,
                        kind: isFile ? 'file' : 'directory',
                        id: entry.path + (isFile ? '-f' : '-d'),
                    };
                    if (!isFile) existing.children = [];
                    if (isFile) {
                        existing.content = content;
                        existing.isVirtual = true;
                    }
                    currentLevel.push(existing);
                }
                currentLevel = existing.children;
            }
        }
    }

    return tree;
};
