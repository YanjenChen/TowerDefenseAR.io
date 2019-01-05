function SidebarToggle(ref){
  ref.classList.toggle('active');
  document.getElementById('sidebar').classList.toggle('active');
}

function FlipPage(page){
  page.classList.toggle('flip');
  document.getElementById('cover').classList.toggle('active');
  $('#cover').transition('horizontal flip')
}


function FlipPage2(page){
  page.classList.toggle('flip');
  document.getElementById('cover').classList.toggle('active');
  $('#cover2').transition('horizontal flip')
}
