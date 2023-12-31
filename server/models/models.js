const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
module.exports = (sequelize, DataTypes) => {

  const TenantModel = sequelize.define('TenantModel',
    {
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: false,
      },
      userCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      }
    },
    {
      tableName: 'tenants',
      timestamps: true,
    }
  );

  const UserModel = sequelize.define('UserModel', {
    userId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    
    firstName: DataTypes.STRING,
    middleName: DataTypes.STRING, // Optional
    lastName: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    tableName: 'users',
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        if(user.password){
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }}
      ,
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    }
  });
  
  /* Hashing passwords of Existing Users
  const migratePasswords = async () => {
    try {
      await sequelize.authenticate();
      console.log('Database connection established.');
  
      const users = await UserModel.findAll();
      for (const user of users) {
        if (user.password) { 
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
          await user.save();
          console.log(`Password updated for user: ${user.userId}`);
        }
      }
  
      console.log('All passwords have been migrated.');
    } catch (error) {
      console.error('Error during migration:', error);
    } finally {
      await sequelize.close();
    }
  }; 
  
  migratePasswords(); 
  */

  const TenantUserModel = sequelize.define('TenantUserModel', {
    tenantId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    roleName: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'tenant_users',
    timestamps: false
  });

  const MasterModel = sequelize.define('MasterModel', {
    masterId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    roleName: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'masters',
    timestamps: false
  });


  const TenantRolePermissionModel = sequelize.define('TenantRolePermissionModel', {
    tenantId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true
    },
    roleName: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    hasFullAccess: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    canAddUsers: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    canViewUsers: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
    }, {
        tableName: 'tenant_role_permissions', // Replace with your actual table name
        timestamps: false // Assuming your table doesn't have created_at and updated_at fields
    });

    const MasterRolePermissionModel = sequelize.define('MasterRolePermissionModel', {
      masterId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true
      },
      roleName: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      hasFullAccess: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      canAddUsers: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      tenantId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true
      }
    }, {
      tableName: 'master_role_permissions', // Replace with your actual table name
      timestamps: false // Assuming your table doesn't have created_at and updated_at fields
    });


    const associate = () => {

      // Add beforeCreate and beforeUpdate hooks
      UserModel.beforeCreate((user, options) => {
        // Set createdAt and updatedAt to the current date and time
        const currentDate = new Date();
        user.createdAt = currentDate;
        user.updatedAt = currentDate;
      });

      UserModel.beforeUpdate((user, options) => {
        // Set updatedAt to the current date and time
        const currentDate = new Date();
        user.updatedAt = currentDate;
      });

      // Create a direct association between Masters and MasterRolePermissionModel
      MasterModel.hasMany(MasterRolePermissionModel, { foreignKey: 'masterId' });
      MasterRolePermissionModel.belongsTo(MasterModel, { foreignKey: 'masterId' });

      // Create a direct association between Master Role Permissions and Tenants
      MasterRolePermissionModel.belongsTo(TenantModel, { foreignKey: 'tenantId' });
      TenantModel.hasMany(MasterRolePermissionModel, { foreignKey: 'tenantId'});

      // Create a direct association between TenantModel and TenantUserModel
      TenantModel.hasMany(TenantUserModel, { foreignKey: 'tenantId' });
      TenantUserModel.belongsTo(TenantModel, { foreignKey: 'tenantId' });

      // Create a many-to-many association between Masters and TenantModel
      MasterModel.belongsToMany(TenantModel, {
        through: MasterRolePermissionModel,
        foreignKey: 'masterId', // Use 'masterId' as the foreign key in the join table
        otherKey: 'tenantId',   // Use 'tenantId' as the other key in the join table
      });
      TenantModel.belongsToMany(MasterModel, {
        through: MasterRolePermissionModel,
        foreignKey: 'tenantId',
        otherKey: 'userId',
      });


      // Define the existing many-to-many associations
      UserModel.belongsToMany(TenantModel, {
        through: TenantUserModel,
        foreignKey: 'userId',
        otherKey: 'tenantId',
      });
    
      TenantModel.belongsToMany(UserModel, {
        through: TenantUserModel,
        foreignKey: 'tenantId',
        otherKey: 'userId',
      });
    };


  return {
    UserModel,
    TenantModel,
    TenantUserModel,
    MasterModel,
    TenantRolePermissionModel,
    MasterRolePermissionModel,
    associate
  }
};

