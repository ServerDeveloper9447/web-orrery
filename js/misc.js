const tgbtn = document.querySelector('#toggle')
const infobox = document.getElementsByClassName('info-box')
tgbtn.addEventListener('click',() => {
    tgbtn.setAttribute('state',tgbtn.getAttribute('state') == 'extended' ? 'collapsed' : 'extended')
    tgbtn.innerText = tgbtn.getAttribute('state') == 'extended' ? 'Collapse' : 'Expand';
    infobox[0].style.height = tgbtn.getAttribute('state') == 'extended' ? 'auto' : '15px';
})