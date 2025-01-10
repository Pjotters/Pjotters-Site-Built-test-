import { auth, db, provider } from './firebase-config.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { collection, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import JSZip from 'jszip';
import templates from './templates.js';

// Auth functies
function login() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            console.log('Ingelogd:', result.user);
            document.getElementById('loginBtn').style.display = 'none';
            document.getElementById('logoutBtn').style.display = 'block';
            document.getElementById('editor').style.display = 'block';
            loadWebsites();
        })
        .catch((error) => console.error('Login error:', error));
}

function logout() {
    auth.signOut()
        .then(() => {
            document.getElementById('loginBtn').style.display = 'block';
            document.getElementById('logoutBtn').style.display = 'none';
            document.getElementById('editor').style.display = 'none';
        })
        .catch((error) => console.error('Logout error:', error));
}

// Editor functies
function addHeading() {
    const heading = document.createElement('h2');
    heading.textContent = 'Nieuwe Kop';
    document.getElementById('content').appendChild(heading);
}

function addParagraph() {
    const para = document.createElement('p');
    para.textContent = 'Nieuwe paragraaf';
    document.getElementById('content').appendChild(para);
}

function addImage() {
    const url = prompt('Voer de URL van de afbeelding in:');
    if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.style.maxWidth = '100%';
        document.getElementById('content').appendChild(img);
    }
}

// Website opslaan
function saveWebsite() {
    const user = auth.currentUser;
    if (!user) return;

    const content = document.getElementById('content').innerHTML;
    
    db.collection('websites').doc(user.uid).set({
        content: content,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => alert('Website opgeslagen!'))
    .catch((error) => console.error('Opslaan mislukt:', error));
}

// Website laden
function loadWebsites() {
    const user = auth.currentUser;
    if (!user) return;

    db.collection('websites').doc(user.uid).get()
        .then((doc) => {
            if (doc.exists) {
                document.getElementById('content').innerHTML = doc.data().content;
            }
        })
        .catch((error) => console.error('Laden mislukt:', error));
}

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'block';
        document.getElementById('editor').style.display = 'block';
        loadWebsites();
    } else {
        document.getElementById('loginBtn').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('editor').style.display = 'none';
    }
});

// Nieuwe website maken
async function createNewWebsite() {
    const user = auth.currentUser;
    if (!user) return;

    const websiteData = {
        name: 'Nieuwe Website',
        template: 'basic-template',
        content: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    try {
        const websiteRef = doc(collection(db, 'users', user.uid, 'websites'));
        await setDoc(websiteRef, websiteData);
        loadWebsiteEditor(websiteRef.id);
    } catch (error) {
        console.error('Fout bij maken nieuwe website:', error);
    }
}

// Website editor laden
async function loadWebsiteEditor(websiteId) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const websiteRef = doc(db, 'users', user.uid, 'websites', websiteId);
        const websiteDoc = await getDoc(websiteRef);
        
        if (websiteDoc.exists()) {
            const websiteData = websiteDoc.data();
            document.getElementById('editor').innerHTML = `
                <div class="website-builder">
                    <div class="toolbar">
                        <button onclick="addSection()">Sectie Toevoegen</button>
                        <button onclick="saveChanges('${websiteId}')">Opslaan</button>
                        <button onclick="previewWebsite('${websiteId}')">Voorvertoning</button>
                    </div>
                    <div id="website-content" class="editor-content">
                        ${await loadTemplate(websiteData.template)}
                    </div>
                </div>
            `;
            makeElementsEditable();
        }
    } catch (error) {
        console.error('Fout bij laden editor:', error);
    }
}

// Template laden
async function loadTemplate(templateName) {
    try {
        const response = await fetch(`/templates/${templateName}.html`);
        return await response.text();
    } catch (error) {
        console.error('Fout bij laden template:', error);
        return '<div>Error loading template</div>';
    }
}

// Elementen bewerkbaar maken
function makeElementsEditable() {
    const editables = document.querySelectorAll('.editable');
    editables.forEach(element => {
        element.addEventListener('click', function() {
            const type = this.dataset.type;
            switch(type) {
                case 'text':
                    editText(this);
                    break;
                case 'menu':
                    editMenu(this);
                    break;
                // Voeg meer types toe indien nodig
            }
        });
    });
}

// Tekst bewerken
function editText(element) {
    const currentText = element.innerHTML;
    element.innerHTML = `
        <textarea style="width: 100%; min-height: 100px;">${currentText}</textarea>
        <button onclick="saveText(this.parentElement)">Opslaan</button>
    `;
}

// Tekst opslaan
function saveText(element) {
    const newText = element.querySelector('textarea').value;
    element.innerHTML = newText;
}

// Menu bewerken
function editMenu(element) {
    const currentMenu = element.innerHTML;
    element.innerHTML = `
        <div class="menu-editor">
            <button onclick="addMenuItem(this.parentElement)">+ Menu Item</button>
            <ul class="menu-items">
                ${currentMenu}
            </ul>
        </div>
    `;
}

// Website exporteren
async function exportWebsite() {
    const websiteContent = document.getElementById('website-content');
    const styles = document.getElementById('customStyles')?.innerHTML || '';
    
    // HTML template maken
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.title}</title>
    <style>
        ${styles}
    </style>
</head>
<body>
    ${websiteContent.innerHTML}
</body>
</html>`;

    // CSS bestand maken
    const cssContent = `
/* Custom styles */
${styles}
    `;

    // Maak een ZIP bestand
    const zip = new JSZip();
    zip.file('index.html', htmlTemplate);
    zip.file('styles.css', cssContent);
    
    // Assets toevoegen (afbeeldingen etc.)
    const images = websiteContent.getElementsByTagName('img');
    for (let img of images) {
        try {
            const response = await fetch(img.src);
            const blob = await response.blob();
            const fileName = img.src.split('/').pop();
            zip.file(`images/${fileName}`, blob);
        } catch (error) {
            console.error('Fout bij downloaden afbeelding:', error);
        }
    }

    // Download ZIP bestand
    zip.generateAsync({type: 'blob'})
        .then(function(content) {
            const url = window.URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'mijn-website.zip';
            link.click();
        });
}

// Code viewer
function viewCode() {
    const websiteContent = document.getElementById('website-content');
    const styles = document.getElementById('customStyles')?.innerHTML || '';
    
    const codeViewer = document.createElement('div');
    codeViewer.className = 'code-viewer';
    codeViewer.innerHTML = `
        <div class="code-tabs">
            <button onclick="showTab('html')">HTML</button>
            <button onclick="showTab('css')">CSS</button>
        </div>
        <div class="code-content">
            <pre id="htmlCode">${escapeHtml(websiteContent.innerHTML)}</pre>
            <pre id="cssCode" style="display:none">${escapeHtml(styles)}</pre>
        </div>
        <button onclick="this.parentElement.remove()">Sluiten</button>
    `;
    
    document.body.appendChild(codeViewer);
}

// Style editor
function openStyleEditor() {
    const styleEditor = document.createElement('div');
    styleEditor.className = 'style-editor';
    styleEditor.innerHTML = `
        <h3>CSS Editor</h3>
        <textarea id="cssEditor">${document.getElementById('customStyles')?.innerHTML || ''}</textarea>
        <button onclick="saveStyles()">Opslaan</button>
        <button onclick="this.parentElement.remove()">Sluiten</button>
    `;
    
    document.body.appendChild(styleEditor);
}

function saveStyles() {
    const css = document.getElementById('cssEditor').value;
    let styleTag = document.getElementById('customStyles');
    
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'customStyles';
        document.head.appendChild(styleTag);
    }
    
    styleTag.innerHTML = css;
}

// Helper functies
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Template systeem
function showTemplateCategory(category) {
    const templateContent = document.getElementById('templateContent');
    templateContent.innerHTML = '';
    
    Object.entries(templates[category]).forEach(([name, template]) => {
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';
        templateItem.innerHTML = `
            <div class="template-preview">${template}</div>
            <button onclick="insertTemplate('${category}', '${name}')">Toevoegen</button>
        `;
        templateContent.appendChild(templateItem);
    });
}

function insertTemplate(category, name) {
    const template = templates[category][name];
    const content = document.getElementById('content');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = template;
    content.appendChild(tempDiv.firstChild);
}

// Lokaal opslaan
function saveLocal() {
    const websiteData = {
        content: document.getElementById('content').innerHTML,
        styles: document.getElementById('customStyles')?.innerHTML || '',
        lastSaved: new Date().toISOString()
    };
    localStorage.setItem('websiteData', JSON.stringify(websiteData));
    alert('Website lokaal opgeslagen!');
}

// Lokaal laden
function loadLocal() {
    const savedData = localStorage.getItem('websiteData');
    if (savedData) {
        const data = JSON.parse(savedData);
        document.getElementById('content').innerHTML = data.content;
        
        let styleTag = document.getElementById('customStyles');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'customStyles';
            document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = data.styles;
    }
} 