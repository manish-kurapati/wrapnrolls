(() => {
 const stage=document.querySelector('.kinetic-stage');
 const brand=stage?.querySelector('.kinetic-brand');
 if(!brand)return;
 function hideCoveredRows(){
  const band=brand.getBoundingClientRect();
  stage.querySelectorAll('.crowded-menu .product-row').forEach(row=>{
   const rect=row.getBoundingClientRect();
   const field=row.closest('.crowded-menu').getBoundingClientRect();
   const behindBrand=rect.bottom>band.top-4&&rect.top<band.bottom+4;
   const clipped=rect.top<field.top-0.5||rect.bottom>field.bottom+0.5;
   row.style.visibility=behindBrand||clipped?'hidden':'';
  });
 }
 new ResizeObserver(hideCoveredRows).observe(stage);
 new ResizeObserver(hideCoveredRows).observe(brand);
 document.fonts.ready.then(hideCoveredRows);
 hideCoveredRows();
})();
