
import json
import re

def get_category_filename(category_name):
    # a given category name can have a "&" or a ":" in the name, so we need to handle that
    # remove special characters and replace spaces with underscores
    s = re.sub(r'[&:]', '', category_name)
    return s.lower().replace(' ', '_')

def update_image_paths():
    with open('src/data/species_index_full.json', 'r') as f:
        species_data = json.load(f)

    with open('src/data/species_by_category.json', 'r') as f:
        category_data = json.load(f)

    species_to_category = {}
    for primary_category in category_data:
        for subcategory in primary_category['subcategories']:
            for species in subcategory['species']:
                species_to_category[species] = subcategory['subcategory']

    exceptions = ["Tyrannosaurus", "Triceratops", "Coelacanth"]

    for species in species_data:
        if species['name'] not in exceptions:
            if species['name'] in species_to_category:
                category = species_to_category[species['name']]
                category_filename = get_category_filename(category)

                # Find the correct icon name from the file system
                icon_filename = f"{category_filename}_icon.webp"
                main_filename = f"{category_filename}.webp"
                xray_filename = f"{category_filename}_skeleton.webp"


                species['icon'] = f"animals/icons/{icon_filename}"
                species['image_url']['image'] = f"animals/main/{main_filename}"
                species['image_url']['xray_image'] = f"animals/skeleton/{xray_filename}"
            else:
                print(f"Warning: Could not find category for species '{species['name']}'")

    with open('src/data/species_index_full_modified.json', 'w') as f:
        json.dump(species_data, f, indent=4)

if __name__ == '__main__':
    update_image_paths()
