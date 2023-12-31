// Name: More Motion
// ID: nkmoremotion
// Description: More motion-related blocks.
// By: NamelessCat <https://scratch.mit.edu/users/NamelessCat/>

(function (Scratch) {
  "use strict";

  if (!Scratch.extensions.unsandboxed) {
    throw new Error("More Motion must run unsandboxed");
  }

  // @ts-expect-error - not typed yet
  const Rectangle = Scratch.vm.renderer.exports.Rectangle;

  const requireNonPackagedRuntime = (blockName) => {
    if (Scratch.vm.runtime.isPackaged) {
      alert(
        `To use the Looks+ ${blockName} block, the creator of the packaged project must uncheck "Remove raw asset data after loading to save RAM" under advanced settings in the packager.`
      );
      return false;
    }
    return true;
  };




  const anchor_position = Symbol('anchor.position');

  const anchor_offset_x = Symbol('anchor.offset.x');
  const anchor_offset_y = Symbol('anchor.offset.y');

  const anchor_updateAnchorEveryBlock = Symbol('anchor.updateAnchorEveryBlock');
  const anchor_updateAnchorEveryFrame = Symbol('anchor.updateAnchorEveryFrame');

  const anchor_resolution = Symbol('anchor.resolution');
  const anchor_retreat = Symbol('anchor.retreat');

  const vm = Scratch.vm;

  /**
  * @param {VM.RenderedTarget} target
  * @param {VM.RenderedTarget} [originalTarget] If target is a clone, the original to copy from.
  */
  const implementAnchorForTarget = (target, originalTarget) => {
    if (anchor_position in target) {
      return;
    }

    target[anchor_position] = originalTarget ? originalTarget[anchor_position] : 'none';

    target[anchor_offset_x] = originalTarget ? originalTarget[anchor_offset_x] : 0;
    target[anchor_offset_y] = originalTarget ? originalTarget[anchor_offset_y] : 0;

    target[anchor_updateAnchorEveryBlock] = originalTarget ? originalTarget[anchor_updateAnchorEveryBlock] : false;
    target[anchor_updateAnchorEveryFrame] = originalTarget ? originalTarget[anchor_updateAnchorEveryFrame] : true;

    target[anchor_resolution] = originalTarget ? originalTarget[anchor_resolution] : 1;
    target[anchor_retreat] = originalTarget ? originalTarget[anchor_retreat] : true;
  };

  vm.runtime.targets.forEach((target) => implementAnchorForTarget(target));

  vm.runtime.on("targetWasCreated", (target, originalTarget) =>
    implementAnchorForTarget(target, originalTarget)
  );

  vm.runtime.on("PROJECT_LOADED", () => {
    vm.runtime.targets.forEach((target) => implementAnchorForTarget(target));
  });

  vm.runtime.on("BEFORE_EXECUTE", () => {
    vm.runtime.targets.forEach((target) => {
      if (target[anchor_updateAnchorEveryFrame]) {
        _updateAnchor({ target: target });
      }
    });
  });
  

  const _touchingEdge = (target, axis) => {
    if (target.renderer) {
      const stageWidth = vm.runtime.stageWidth;
      const stageHeight = vm.runtime.stageHeight;

      const bounds = target.getBounds();

      if (axis.toLowerCase() == "x") {
        return bounds.left < -stageWidth / 2 || bounds.right > stageWidth / 2;
      }

      if (axis.toLowerCase() == "y") {
        return bounds.top > stageHeight / 2 || bounds.bottom < -stageHeight / 2;
      }
    }

    return false;
  };

  const _move = (target, info, x, y, resolution = 1, retreat = true) => {
    const maxAttempts = (info.size.x + info.size.y) * resolution;
    let attempts = maxAttempts;

    /*
    while (target.isTouchingObject('_edge_') && attempts > 0) {
      target.setXY(target.x + x / resolution, target.y + y / resolution);
      attempts -= 1;
    }
    */

    if (x != 0) {
      attempts = maxAttempts;

      while (_touchingEdge(target, "x") && attempts > 0) {
        target.setXY(target.x + x / resolution, target.y);
        attempts -= 1;
      }

      if (retreat) {
        target.setXY(target.x - x / resolution, target.y);
      }
    }

    if (y != 0) {
      attempts = maxAttempts;

      while (_touchingEdge(target, "y") && attempts > 0) {
        target.setXY(target.x, target.y + y / resolution);
        attempts -= 1;
      }

      if (retreat) {
        target.setXY(target.x, target.y - y / resolution);
      }
    }

    if (x != 0) {
      attempts = maxAttempts;

      while (!_touchingEdge(target, "x") && attempts > 0) {
        target.setXY(target.x - x / resolution, target.y);
        attempts -= 1;
      }

      if (retreat) {
        target.setXY(target.x + x / resolution, target.y);
      }
    }

    if (y != 0) {
      attempts = maxAttempts;

      while (!_touchingEdge(target, "y") && attempts > 0) {
        target.setXY(target.x, target.y - y / resolution);
        attempts -= 1;
      }

      if (retreat) {
        target.setXY(target.x, target.y + y / resolution);
      }
    }
  };

  const _updateAnchor = (utils) => {
    const target = utils.target;

    if (target[anchor_position] == 'none') {
      return;
    }

    const renderedInfo = target._getRenderedDirectionAndScale();

    const scale = renderedInfo.scale;
    const direction = renderedInfo.direction;

    const costumes = target.sprite.costumes_;
    const costume_number = target.currentCostume;

    var info = {
      position: {
        x: target.x,
        y: target.y
      },
      size: {
        x: costumes[costume_number].size[0] * (scale[0] / 100),
        y: costumes[costume_number].size[1] * (scale[1] / 100)
      }
    }

    switch (target[anchor_position]) {
      case 'top left':
        target.setXY(
          vm.runtime.stageWidth / -2,
          vm.runtime.stageHeight / 2
        );

        _move(target, info, 1, -1, target[anchor_resolution], target[anchor_retreat]);

        break;
      case 'top center':
        target.setXY(
          0,
          vm.runtime.stageHeight / 2
        );

        _move(target, info, 0, -1, target[anchor_resolution], target[anchor_retreat]);

        break;
      case 'top right':
        target.setXY(
          vm.runtime.stageWidth / 2,
          vm.runtime.stageHeight / 2
        );

        _move(target, info, -1, -1, target[anchor_resolution], target[anchor_retreat]);

        break;
      case 'middle left':
        target.setXY(
          vm.runtime.stageWidth / -2,
          0
        );

        _move(target, info, 1, 0, target[anchor_resolution], target[anchor_retreat]);

        break;
      case 'middle center':
        target.setXY(0, 0);
        break;
      case 'middle right':
        target.setXY(
          vm.runtime.stageWidth / 2,
          0
        );

        _move(target, info, -1, 0, target[anchor_resolution], target[anchor_retreat]);

        break;
      case 'bottom left':
        target.setXY(
          vm.runtime.stageWidth / -2,
          vm.runtime.stageHeight / -2
        );

        _move(target, info, 1, 1, target[anchor_resolution], target[anchor_retreat]);

        break;
      case 'bottom center':
        target.setXY(
          0,
          vm.runtime.stageHeight / -2
        );

        _move(target, info, 0, 1, target[anchor_resolution], target[anchor_retreat]);

        break;
      case 'bottom right':
        target.setXY(
          vm.runtime.stageWidth / 2,
          vm.runtime.stageHeight / -2
        );

        _move(target, info, -1, 1, target[anchor_resolution], target[anchor_retreat]);

        break;
      default:
        break;
    }

    target.setXY(
      target.x + target[anchor_offset_x],
      target.y + target[anchor_offset_y]
    );
  };



  

  class nkmoremotion {
    getInfo() {
      return {
        id: "nkmoremotion",
        name: "More Motion",
        color1: "#D34B2D",
        color2: "#B73E23",
        color3: "#52180C",
        blocks: [
          {
            filter: [Scratch.TargetType.STAGE],
            blockType: Scratch.BlockType.LABEL,
            text: "Stage selected: no motion blocks",
          },
          {
            filter: [Scratch.TargetType.SPRITE],
            opcode: "setXY",
            blockType: Scratch.BlockType.COMMAND,
            text: "выравнить костюм [ALIGN] отступить по x: [AX] y: [AY]",
            arguments: {
              ALIGN: {
                type: Scratch.ArgumentType.STRING,
                menu: "AlignMenu",
              },
              AX: {
                type: Scratch.ArgumentType.NUMBER,
              },
              AY: {
                type: Scratch.ArgumentType.NUMBER,
              },
            },
          },
          {
            opcode: "costumeAttribute",
            blockType: Scratch.BlockType.REPORTER,
            text: "[ATTRIBUTE] of [COSTUME]",
            arguments: {
              ATTRIBUTE: {
                type: Scratch.ArgumentType.STRING,
                menu: "costumeAttribute",
              },
              COSTUME: {
                type: Scratch.ArgumentType.COSTUME,
              },
            },
          },



          {
            opcode: 'setPosition',
            blockType: Scratch.BlockType.COMMAND,
            text: 'set anchor position to [POSITION]',
            filter: [Scratch.TargetType.SPRITE],
            arguments: {
              POSITION: {
                type: Scratch.ArgumentType.STRING,
                menu: 'POSITION'
              }
            }
          },
          
        ],
        menus: {
          costumeAttribute: {
            acceptReporters: false,
            items: [ 
              "width", 
              "height", 
              "format", 
              {
                text: "rotation center x",
                value: "rotationCenterX",
              },
              {
                text: "rotation center y",
                value: "rotationCenterY",
              },
            ],
          },

          AlignMenu: {
            acceptReporters: false,
            items: [ 
              {
                text: "по центру",
                value: "center",
              },
              {
                text: "по правому краю",
                value: "right",
              },
              {
                text: "по левому краю",
                value: "left",
              },
              {
                text: "по верхнему краю",
                value: "top",
              },
              {
                text: "по нижнему краю",
                value: "bottom",
              },
              {
                text: "в правом верхнем углу",
                value: "rightTop",
              },
              {
                text: "в правом нижнем углу",
                value: "rightBottom",
              },
              {
                text: "в левом верхнем углу",
                value: "leftTop",
              },
              {
                text: "в левом нижнем углу",
                value: "leftBottom",
              },
            ],
          },


          POSITION: {
            acceptReporters: true,
            items: ['top left', 'top center', 'top right', 'middle left', 'middle center', 'middle right', 'bottom left', 'bottom center', 'bottom right', 'none']
          },
        },
      };
    }    

    
    setPosition(args, utils) {
      utils.target[anchor_position] = args.POSITION;

      if (utils.target[anchor_updateAnchorEveryBlock]) {
        this.updateAnchor(args, utils);
      }
    }


    
    costumeAttribute(args, util) {
      const costumeIndex = this.getCostumeInput(args.COSTUME, util.target);
      const costume = util.target.sprite.costumes[costumeIndex];
      if (!costume) {
        console.error("Costume doesn't exist");
        return 0;
      }

      const attribute = args.ATTRIBUTE;
      if (attribute === "width") {
        return Math.ceil(Scratch.Cast.toNumber(costume.size[0]));
      } else if (attribute === "height") {
        return Math.ceil(Scratch.Cast.toNumber(costume.size[1]));
      } else if (attribute === "format") {
        if (!requireNonPackagedRuntime("costume format")) {
          return "unknown";
        }
        return costume.asset.assetType.runtimeFormat;
      } else if (attribute === "rotationCenterX") {
        return costume.rotationCenterX;
      } else if (attribute === "rotationCenterY") {
        return costume.rotationCenterY;
      } else {
        return "";
      }
    }
    getCostumeInput(costume, target) {
      if (typeof costume === "number") {
        costume = Math.round(costume - 1);
        if (costume === Infinity || costume === -Infinity || !costume) {
          costume = 0;
        }
        costume = this.wrapClamp(costume, 0, target.sprite.costumes.length - 1);
        return costume;
      } else {
        return target.getCostumeIndexByName(Scratch.Cast.toString(costume));
      }
    }
    getSprites() {
      const spriteNames = [];
      const targets = Scratch.vm.runtime.targets;
      const myself = Scratch.vm.runtime.getEditingTarget().getName();
      for (let index = 1; index < targets.length; index++) {
        const target = targets[index];
        if (target.isOriginal) {
          const targetName = target.getName();
          if (targetName === myself) {
            spriteNames.unshift({
              text: "this sprite",
              value: targetName,
            });
          } else {
            spriteNames.push({
              text: targetName,
              value: targetName,
            });
          }
        }
      }
      if (spriteNames.length > 0) {
        return spriteNames;
      } else {
        return [{ text: "", value: 0 }];
      }
    }


    setXY(args, util) {
      const x = Scratch.Cast.toNumber(args.AX);
      const y = Scratch.Cast.toNumber(args.AY);

      const spriteNames = [];
      const targets = Scratch.vm.runtime.targets;
      const myself = Scratch.vm.runtime.getEditingTarget().getName();
      
      if (args.ALIGN == "center") {
        const center = util.target.setXY( 0, 0 );
      } else if (args.ALIGN == "right") {
        const right = util.target.setXY( ((Scratch.vm.runtime.stageWidth / 2) - Scratch.vm.anchor.offset.y ) , 0 );
      } else if (args.ALIGN == "left") {
        const left = util.target.setXY( (-1 * (Scratch.vm.runtime.stageWidth / 2)) , 0 );
      } else if (args.ALIGN == "top") {
        const top = util.target.setXY( 0 , (Scratch.vm.runtime.stageHeight / 2) );
      } else if (args.ALIGN == "bottom") {
        const bottom = util.target.setXY( 0 , (-1 * (Scratch.vm.runtime.stageHeight / 2)) );
      } else if (args.ALIGN == "rightTop") {
        const rightTop = util.target.setXY( (Scratch.vm.runtime.stageWidth / 2) , (Scratch.vm.runtime.stageHeight / 2) );
      } else if (args.ALIGN == "rightBottom") {
        const rightBottom = util.target.setXY( (Scratch.vm.runtime.stageWidth / 2) , (-1 * (Scratch.vm.runtime.stageHeight / 2)) );
      } else if (args.ALIGN == "leftTop") {
        const leftTop = util.target.setXY( (-1 * (Scratch.vm.runtime.stageWidth / 2)) , (Scratch.vm.runtime.stageHeight / 2) );
      } else if (args.ALIGN == "leftBottom") {
        const leftBottom = util.target.setXY( (-1 * (Scratch.vm.runtime.stageWidth / 2)) , (-1 * (Scratch.vm.runtime.stageHeight / 2)) );
      }
      util.target.setXY(util.target.x + x, util.target.y + y);
    }
  }
  

  Scratch.extensions.register(new nkmoremotion());
})(Scratch);
