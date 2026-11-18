-- Bring existing menu records into line with the updated public menu copy.
update public.products
set name = regexp_replace(name, '\mroll\M', 'Wrap', 'gi'),
    description = regexp_replace(description, '\mroll\M', 'wrap', 'gi'),
    ingredients = regexp_replace(ingredients, '\mroll\M', 'wrap', 'gi')
where category = 'wraps'
  and (name ~* '\mroll\M' or description ~* '\mroll\M' or ingredients ~* '\mroll\M');
