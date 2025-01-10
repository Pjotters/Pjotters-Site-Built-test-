const templates = {
    buttons: {
        primary: `<button class="btn-primary">Primaire Knop</button>`,
        secondary: `<button class="btn-secondary">Secundaire Knop</button>`,
        outline: `<button class="btn-outline">Outline Knop</button>`
    },
    text: {
        header1: `<h1 class="editable">Hoofdtitel</h1>`,
        header2: `<h2 class="editable">Subtitel</h2>`,
        paragraph: `<p class="editable">Lorem ipsum dolor sit amet...</p>`
    },
    media: {
        youtube: `<div class="video-container"><iframe width="560" height="315" src="URL" frameborder="0" allowfullscreen></iframe></div>`,
        image: `<img src="URL" alt="Afbeelding" class="responsive-img">`
    },
    sections: {
        hero: `<section class="hero">
                 <h1>Welkom</h1>
                 <p>Uw hero tekst hier</p>
                 <button>Actie</button>
               </section>`,
        features: `<section class="features">
                    <div class="feature-item">
                      <h3>Feature 1</h3>
                      <p>Beschrijving</p>
                    </div>
                  </section>`
    }
};

export default templates; 