export default function decorate(block) {
  const iconBlockChildren = [...block.children];
  if(!iconBlockChildren || iconBlockChildren.length < 1) return;

  const initialIconsDiv = iconBlockChildren[0];
  if(!initialIconsDiv
    || !initialIconsDiv.children
    || initialIconsDiv.children.length < 1) {
    return;
  }

  const allIcons = initialIconsDiv.children[0];
  console.log(allIcons);
}