# == Schema Information
#
# Table name: tags
#
#  id             :integer          not null, primary key
#  name           :string(255)
#  taggings_count :integer
#

class Tag < ActiveRecord::Base
  validates :name, presence: true
end