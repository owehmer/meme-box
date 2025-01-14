import {Pipe, PipeTransform} from '@angular/core';
import {Clip, MEDIA_TYPE_INFORMATION, MediaType} from '@memebox/contracts';
import groupBy from 'lodash/groupBy';

export interface MediGroup {
  groupName: string;
  medias: Clip[];
}

@Pipe({
  name: 'groupByMediaType'
})
export class GroupByMediaTypePipe implements PipeTransform {

  transform(medias: Clip[]): MediGroup[] {
    if (medias == null || medias.length === 0) {
      return [];
    }

    const validTypes = Object.values(MediaType);

    const groups = groupBy(medias, m => validTypes.includes(m.type) ? m.type : MediaType.Invalid);

    return Object.keys(groups).map(gKey => ({
      groupName: MEDIA_TYPE_INFORMATION[groups[gKey][0].type]?.translationKey ?? 'invalid',
      medias: groups[gKey]
    }));
  }

}
