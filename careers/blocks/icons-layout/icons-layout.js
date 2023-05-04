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

  const iconNodes = [];
  let currentIconNode = null;
  allIcons.forEach((iconLayoutElement) => {
    // check if current element is an icon or not
    // if icon, add previous icon to list, create new node

    // if not icon, add content as is to current icon node
  });

  // handle last icon node, if any, since we may go out of the loop before adding it
  if(!!currentIconNode){
    iconNodes.push(currentIconNode);
  }
}