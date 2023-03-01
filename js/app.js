function iniciarApp() {

    const resultado = document.querySelector('#resultado');

    
    //se selecciona el select
    const selectCategorias = document.querySelector('#categorias');

    if(selectCategorias){
        selectCategorias.addEventListener('change', seleccionarCategoria);
        obtenerCategorias();
    }

    const favoritosDiv =document.querySelector('.favoritos');
    if(favoritosDiv){
        obtenerFavoritos();
    }
    const modal = new bootstrap.Modal('#modal', {});


    function obtenerCategorias() {
        const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';
        fetch(url)
            .then(respuesta => respuesta.json())
            .then(datos => mostrarCategorias(datos.categories));

    }

    //Llena el select en el HTML
    function mostrarCategorias(categorias = []) {

        //Ordena el array 
        categorias.sort((a, b) => a.strCategory.localeCompare(b.strCategory));


        //se itera el array y se llena el select en el HTML
        categorias.forEach(categoria => {
            const { strCategory } = categoria;
            const option = document.createElement('OPTION');
            option.value = strCategory;
            option.textContent = strCategory;
            selectCategorias.appendChild(option);
        });
    }

    function seleccionarCategoria(e) {

        const categoria = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;

        fetch(url)
            .then(respuesta => respuesta.json())
            .then(datos => mostrarRecetas(datos.meals));
    }

    function mostrarRecetas(recetas = []) {
        limpiarHTML(resultado);

        const heading = document.createElement('H2');
        heading.classList.add('text-center', 'text-black', 'my-5');
        heading.textContent = recetas.length ? 'Resultados...' : 'No hay resultados';
        resultado.appendChild(heading);


        //iterar en las recetas
        recetas.forEach(receta => {
            const { idMeal, strMeal, strMealThumb } = receta;

            const contenedor = document.createElement('DIV');
            contenedor.classList.add('col-md-4');

            const recetaCard = document.createElement('DIV');
            recetaCard.classList.add('card', 'mb-4');

            const recetaImagen = document.createElement('IMG');
            recetaImagen.classList.add('card-img-top');
            recetaImagen.alt = `Imagen de la receta ${strMeal ?? receta.titulo}`;
            recetaImagen.src = strMealThumb ?? receta.img;

            const recetaCardBody = document.createElement('DIV');
            recetaCardBody.classList.add('card-body');

            const recetedaCardHeading = document.createElement('H3');
            recetedaCardHeading.classList.add('card-title', 'mb-3');
            recetedaCardHeading.textContent = strMeal ?? receta.titulo;

            const recetaButton = document.createElement('BUTTON');
            recetaButton.classList.add('btn', 'btn-danger', 'w-100');
            recetaButton.textContent = 'Ver receta';
            // recetaButton.dataset.bsTarget = '#modal';
            // recetaButton.dataset.bsToggle = 'modal';
            recetaButton.onclick = function () {
                seleccionarReceta(idMeal ?? receta.id);
            }

            //Inyectar en el codigo HTML
            recetaCardBody.appendChild(recetedaCardHeading);
            recetaCardBody.appendChild(recetaButton);

            recetaCard.appendChild(recetaImagen);
            recetaCard.appendChild(recetaCardBody);

            contenedor.appendChild(recetaCard);

            resultado.appendChild(contenedor);

            // console.log(recetaImagen);
        });
    }

    function seleccionarReceta(id) {
        const url = `https://themealdb.com/api/json/v1/1/lookup.php?i=${id}`;

        fetch(url)
            .then(respuesta => respuesta.json())
            .then(datos => mostrarRecetaModal(datos.meals[0]));
    }

    function mostrarRecetaModal(receta) {

        const {idMeal, strInstructions, strMeal,strMealThumb} = receta;

        //Anhadir contenido al modal
        const modalHeading = document.querySelector('.modal .modal-title');
        const modalBody = document.querySelector('.modal .modal-body');

        modalHeading.textContent = strMeal;
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="Receta ${strMeal}" />
            <h3>Instrucciones:</h3>
            <p > ${strInstructions} </p>
            <h3 class="my-3">Ingrefientes y Cantidades</h3>
        `;

        const listGroup = document.createElement('UL');
        listGroup.classList.add('list-group');

        //iterar ingredientes
        for (let i = 1; i <= 20 ; i++) {
            
            if(receta[`strIngredient${i}`]){
                const ingrediente = receta[`strIngredient${i}`];
                const cantidad =receta[`strMeasure${i}`];

                const ingredienteLi = document.createElement('LI');
                ingredienteLi.classList.add('list-group-item');
                ingredienteLi.textContent = `${ingrediente} - ${cantidad} `;

                listGroup.appendChild(ingredienteLi);

               
            }
            
        }
        //Agrega la lista de ingredientes
        modalBody.appendChild(listGroup);

        const modalFooter = document.querySelector('.modal-footer');
        limpiarHTML(modalFooter);
        
        //Botones de cerrar y favorito
        const btnFavorito = document.createElement('BUTTON');
        btnFavorito.classList.add('btn', 'btn-danger', 'col');
        btnFavorito.textContent = existeStorage(idMeal) ? 'Eliminar Favorito' : 'Guardar Favorito';

        //LocalStorage
        btnFavorito.onclick = function(){
            
            if(!existeStorage(idMeal)){
                agregarFavorito({
                    id: idMeal,
                    titulo: strMeal,
                    img: strMealThumb
                });
                btnFavorito.textContent = 'Eliminar Favorito';
                mostrarToast('Agregado correctamente');

            }else{
                btnFavorito.textContent = 'Guardar Favorito';
                eliminarFavorito(idMeal);
                mostrarToast('Eliminado correctamente');
            }

        };
        
        const btnCerrar = document.createElement('BUTTON');
        btnCerrar.classList.add('btn', 'btn-secondary', 'col');
        btnCerrar.textContent = 'Cerrar';
        btnCerrar.onclick = function(){
           modal.hide(); 
        };



        modalFooter.appendChild(btnFavorito);
        modalFooter.appendChild(btnCerrar);


        //Muestra el modal
        modal.show();

    }

    function agregarFavorito(receta){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        localStorage.setItem('favoritos', JSON.stringify([...favoritos, receta]))
    }
    
    function eliminarFavorito(id){
        let favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        favoritos = favoritos.filter(favorito => favorito.id !== id);
        localStorage.setItem('favoritos', JSON.stringify([...favoritos]))
    }
    
    function existeStorage(id){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        return favoritos.some(favorito => favorito.id === id);
        
    }
    
    function mostrarToast(mensaje){
        const toastDiv = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');
        const toast = new bootstrap.Toast(toastDiv);

        toastBody.textContent = mensaje;

        toast.show();

    }

    function obtenerFavoritos(){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];

        if (favoritos.length) {
            mostrarRecetas(favoritos);
            return;
        }
        //Se crea el parrado poe si no hay favoritos en LocalStorage
        const noFavoritos = document.createElement('P');
        noFavoritos.classList.add('fs-4','text-center','font-bold','mt-5');
        noFavoritos.textContent = 'No hay favoritos aun...'

        //Muestra en 
        resultado.appendChild(noFavoritos);
    }

    function limpiarHTML(selector) {
        while (selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    }
}

document.addEventListener('DOMContentLoaded', iniciarApp);