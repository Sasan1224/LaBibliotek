const db = firebase.firestore();
const formularioLogin = document.getElementById("loginForm");
const booksContainer = document.getElementById("booksContainer");
const signoutBtn = document.getElementById("signout");

var user = null;

firebase.auth().onAuthStateChanged((user) => {
    console.warn("Cambio el estado del usuario")
    if (user) {
        renderOverlay();
        renderLibrary(user.email);
    } else {
    }
});

formularioLogin.addEventListener("submit", (e) => {
    e.preventDefault();
    let email = formularioLogin.querySelector("input[type=email]").value
    let password = formularioLogin.querySelector("input[type=password]").value
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            user = userCredential.user;
            console.warn("Logueado con exito");
        })
        .catch((error) => {
            document.querySelector("label").style.display="block";
        });
})


signoutBtn.addEventListener('click',()=>{
    indexedDB.deleteDatabase("firebaseLocalStorageDb")
    location.reload();
})

const renderLibrary = async (email) => {
    document.querySelector(".sectionLogged").style.display = "flex";
    formularioLogin.style.display = "none";
    getUser(email);
    await db.collection("libros").get().then(res => res.forEach(doc => {
        let name = doc.data().nombre;
        let value = doc.data().calificacion;
        booksContainer.innerHTML += renderBookComponent(name, value);
    }))
    updateFunctionStars(email);
}

const renderBookComponent = (name, value) => {
    let disabled = user.data().votacion ? "disabled" : "";
    if(user.data().votacion){
        document.querySelector("p").style.display = "block";
    }
    return `
    <div class="book">
                <div class="infoLeft">
                    <h4>${name}</h4>
                    <ul class="list-inline rating-list">
                        <li><i class="fa fa-star ${disabled}" id="${name}" title="5"></i></li>
                        <li><i class="fa fa-star ${disabled}" id="${name}" title="4"></i></li>
                        <li><i class="fa fa-star ${disabled}" id="${name}" title="3"></i></li>
                        <li><i class="fa fa-star ${disabled}" id="${name}" title="2"></i></li>
                        <li><i class="fa fa-star ${disabled}" id="${name}" title="1"></i></li>
                    </ul>
                </div>
                <div class="infoRight">
                    <h5>Calificacion general:</h5>
                    <br>
                    <p>${value.toFixed(1)}</p>
                </div>
            </div>
    `
}

const getUser = async (email) =>{
    await db.collection("usuarios").where('email', '==', email).get().then(async (snapshot) => {
         user = snapshot.docs[0];
      });
}

const renderOverlay = () => {
    document.querySelector(".loadingOverlay").style.display="flex";
    setTimeout(() => {
        document.querySelector(".loadingOverlay").style.display="none";
    },2e3);
}

const updateFunctionStars = (email) =>{
    document.querySelectorAll(".fa").forEach(element=>{
        if(!element.classList.contains("disabled")){
            element.addEventListener("click",()=>{
                voteForBook(element.id,parseFloat(element.title),email);
            })
        }
    })
}

const voteForBook = (name,value,email) =>{
    renderOverlay();
    db.collection("libros").where('nombre', '==', name).get().then(async (snapshot) => {
        await snapshot.docs[0].ref.update({
            calificacion : (snapshot.docs[0].data().calificacion + value)/(2),
            nombre : name,
            numero_valoraciones : snapshot.docs[0].data().numero_valoraciones + 1
        }).then(() => {
            db.collection("usuarios").where('email', '==', email).get().then(async (snapshot) => {
                await snapshot.docs[0].ref.update({
                    email,
                    votacion : true
                }).then(() => {
                    booksContainer.innerHTML ="";
                    renderLibrary(email);
                })
            });
        });
    });
}

window.addEventListener("DOMContentLoaded", (e) => {
   renderOverlay();
})