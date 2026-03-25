export const copyToClipboardFallback = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    } else {
        return new Promise((resolve, reject) => {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                
                // Avoid scrolling to bottom
                textArea.style.top = "0";
                textArea.style.left = "0";
                textArea.style.position = "fixed";
                
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (successful) {
                    resolve();
                } else {
                    console.error('Fallback: Copy command was unsuccessful');
                    reject(new Error('Copy command failed'));
                }
            } catch (err) {
                console.error('Fallback: Oops, unable to copy', err);
                reject(err);
            }
        });
    }
};
